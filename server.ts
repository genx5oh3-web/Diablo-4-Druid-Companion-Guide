import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// In-memory Xbox OAuth session store keyed by opaque session cookie ID
interface XboxSessionData {
  xuid: string;
  gamertag: string;
  gamerscore: number;
  avatarUrl: string;
  diabloStats: {
    found: boolean;
    titleId?: string;
    titleName?: string;
    hoursPlayed?: number;
    currentAchievements?: number;
    totalAchievements?: number;
    currentGamerscore?: number;
    maxGamerscore?: number;
    lastTimePlayed?: string;
    recentAchievements: { name: string; description: string; unlocked: boolean; gamerscore: number }[];
  };
  connectedAt: string;
}

const xboxSessions = new Map<string, XboxSessionData>();
const oauthStates = new Map<string, number>();

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      result[key] = val;
    }
  }
  return result;
}

function getAppBaseUrl(): string {
  return (process.env.APP_URL || '').replace(/\/+$/, '');
}

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractApiError(err: unknown): { status: number; message: string; requiresPaidKey?: boolean } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return {
      status: 429,
      requiresPaidKey: true,
      message:
        'API quota exhausted or paid-tier model requested. Please attach a billing-enabled Gemini API key in Settings > Secrets.',
    };
  }
  if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid')) {
    return {
      status: 403,
      requiresPaidKey: true,
      message:
        'Permission denied or API key missing/invalid. Check your GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (lower.includes('404') || lower.includes('not_found')) {
    return {
      status: 404,
      message: `Requested model or resource was not found: ${raw}`,
    };
  }
  return {
    status: 500,
    message: raw || 'Unexpected server error while calling Gemini API.',
  };
}

// ============================================================================
// XBOX LIVE OAUTH 2.0 & REAL PROFILE / DIABLO IV TITLE DATA
// ============================================================================

app.get('/api/auth/xbox/status', (req, res) => {
  const appUrl = getAppBaseUrl();
  const configured = Boolean(process.env.XBOX_CLIENT_ID && process.env.XBOX_CLIENT_SECRET);
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies['d4_xbox_sid'];
  const session = sid ? xboxSessions.get(sid) || null : null;

  res.json({
    configured,
    redirectUri: appUrl ? `${appUrl}/auth/xbox/callback` : '/auth/xbox/callback',
    session,
  });
});

app.get('/api/auth/xbox/url', (_req, res) => {
  const clientId = process.env.XBOX_CLIENT_ID;
  const appUrl = getAppBaseUrl();

  if (!clientId || !process.env.XBOX_CLIENT_SECRET) {
    res.status(400).json({
      error:
        'Xbox Live OAuth is not configured yet. Set XBOX_CLIENT_ID and XBOX_CLIENT_SECRET in Settings > Secrets.',
      needsConfiguration: true,
      redirectUri: appUrl ? `${appUrl}/auth/xbox/callback` : '/auth/xbox/callback',
    });
    return;
  }

  if (!appUrl) {
    res.status(500).json({ error: 'APP_URL environment variable is not available.' });
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  oauthStates.set(state, Date.now() + 10 * 60 * 1000);

  const redirectUri = `${appUrl}/auth/xbox/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'XboxLive.signin offline_access',
    state,
    prompt: 'select_account',
  });

  const url = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params.toString()}`;
  res.json({ url, redirectUri });
});

async function handleXboxCallback(req: express.Request, res: express.Response) {
  const sendPopupError = (msg: string) => {
    const safeMsg = JSON.stringify(msg);
    res.status(400).send(`
      <html>
        <body style="background:#0c0a09;color:#e7e5e4;font-family:sans-serif;padding:24px;">
          <h2 style="color:#f59e0b;">Xbox Authentication Error</h2>
          <p>${msg.replace(/</g, '&lt;')}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${safeMsg} }, '*');
            }
          </script>
        </body>
      </html>
    `);
  };

  try {
    const { code, state, error, error_description } = req.query as Record<string, string>;
    if (error) {
      sendPopupError(error_description || error);
      return;
    }
    if (!code || !state) {
      sendPopupError('Missing authorization code or state from Microsoft OAuth callback.');
      return;
    }

    const stateExpiry = oauthStates.get(state);
    oauthStates.delete(state);
    if (!stateExpiry || stateExpiry < Date.now()) {
      sendPopupError('OAuth state expired or invalid. Please try connecting again.');
      return;
    }

    const clientId = process.env.XBOX_CLIENT_ID!;
    const clientSecret = process.env.XBOX_CLIENT_SECRET!;
    const redirectUri = `${getAppBaseUrl()}/auth/xbox/callback`;

    // Step 1: Exchange code for Microsoft OAuth token
    const tokenResp = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'XboxLive.signin offline_access',
      }),
    });
    const tokenJson = (await tokenResp.json()) as { access_token?: string; error_description?: string };
    if (!tokenResp.ok || !tokenJson.access_token) {
      sendPopupError(tokenJson.error_description || 'Failed to exchange Microsoft OAuth code.');
      return;
    }

    // Step 2: Xbox Live User Authenticate
    const xblResp = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        Properties: {
          AuthMethod: 'RPS',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `d=${tokenJson.access_token}`,
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
      }),
    });
    const xblJson = (await xblResp.json()) as { Token?: string };
    if (!xblResp.ok || !xblJson.Token) {
      sendPopupError('Failed to authenticate with Xbox Live user service.');
      return;
    }

    // Step 3: XSTS Token Authorization
    const xstsResp = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xblJson.Token],
        },
        RelyingParty: 'http://xboxlive.com',
        TokenType: 'JWT',
      }),
    });
    const xstsJson = (await xstsResp.json()) as {
      Token?: string;
      DisplayClaims?: { xui?: { uhs?: string; xid?: string; gtg?: string }[] };
      XErr?: number;
    };

    if (!xstsResp.ok || !xstsJson.Token || !xstsJson.DisplayClaims?.xui?.[0]) {
      sendPopupError(
        xstsJson.XErr === 2148916233
          ? 'This Microsoft account does not have an Xbox Live profile yet.'
          : 'Failed to obtain Xbox Live XSTS authorization token.'
      );
      return;
    }

    const claim = xstsJson.DisplayClaims.xui[0];
    const uhs = claim.uhs || '';
    const xuid = claim.xid || '';
    const authHeader = `XBL3.0 x=${uhs};${xstsJson.Token}`;

    // Step 4: Fetch real Xbox Profile settings
    let gamertag = claim.gtg || 'Xbox Player';
    let gamerscore = 0;
    let avatarUrl = '';

    const profileResp = await fetch(
      'https://profile.xboxlive.com/users/me/profile/settings?settings=Gamertag,ModernGamertag,GameDisplayPicRaw,Gamerscore',
      {
        headers: {
          Authorization: authHeader,
          'x-xbl-contract-version': '3',
          Accept: 'application/json',
        },
      }
    );
    if (profileResp.ok) {
      const pJson = (await profileResp.json()) as {
        profileUsers?: { settings?: { id: string; value: string }[] }[];
      };
      const settings = pJson.profileUsers?.[0]?.settings || [];
      for (const s of settings) {
        if (s.id === 'ModernGamertag' && s.value) gamertag = s.value;
        else if (s.id === 'Gamertag' && s.value && gamertag === 'Xbox Player') gamertag = s.value;
        else if (s.id === 'Gamerscore' && s.value) gamerscore = Number(s.value) || 0;
        else if (s.id === 'GameDisplayPicRaw' && s.value) avatarUrl = s.value;
      }
    }

    // Step 5: Fetch real Diablo IV Title History & Achievements on Xbox Live
    const diabloStats: XboxSessionData['diabloStats'] = {
      found: false,
      recentAchievements: [],
    };

    if (xuid) {
      const titleResp = await fetch(
        `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titlehistory/decoration/achievement,scid,detail`,
        {
          headers: {
            Authorization: authHeader,
            'x-xbl-contract-version': '2',
            'Accept-Language': 'en-US',
            Accept: 'application/json',
          },
        }
      );

      if (titleResp.ok) {
        const tJson = (await titleResp.json()) as {
          titles?: Array<{
            titleId?: string;
            name?: string;
            titleHistory?: { lastTimePlayed?: string };
            achievement?: {
              currentAchievements?: number;
              totalAchievements?: number;
              currentGamerscore?: number;
              totalGamerscore?: number;
            };
            detail?: { minutesPlayed?: number };
          }>;
        };

        const d4Title = (tJson.titles || []).find(
          (t) => t.name && /diablo\s*(iv|4)/i.test(t.name)
        );

        if (d4Title && d4Title.titleId) {
          diabloStats.found = true;
          diabloStats.titleId = d4Title.titleId;
          diabloStats.titleName = d4Title.name;
          diabloStats.currentAchievements = d4Title.achievement?.currentAchievements;
          diabloStats.totalAchievements = d4Title.achievement?.totalAchievements;
          diabloStats.currentGamerscore = d4Title.achievement?.currentGamerscore;
          diabloStats.maxGamerscore = d4Title.achievement?.totalGamerscore;
          diabloStats.lastTimePlayed = d4Title.titleHistory?.lastTimePlayed;

          // Fetch individual Diablo IV achievements
          const achResp = await fetch(
            `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?titleId=${d4Title.titleId}&maxItems=30`,
            {
              headers: {
                Authorization: authHeader,
                'x-xbl-contract-version': '2',
                'Accept-Language': 'en-US',
                Accept: 'application/json',
              },
            }
          );
          if (achResp.ok) {
            const achJson = (await achResp.json()) as {
              achievements?: Array<{
                name?: string;
                description?: string;
                progressState?: string;
                rewards?: Array<{ value?: string }>;
              }>;
            };
            diabloStats.recentAchievements = (achJson.achievements || []).slice(0, 12).map((a) => ({
              name: a.name || 'Achievement',
              description: a.description || '',
              unlocked: a.progressState === 'Achieved',
              gamerscore: Number(a.rewards?.[0]?.value || 0),
            }));
          }

          // Try UserStats endpoint for exact minutes played if available
          const statsResp = await fetch(
            `https://userstats.xboxlive.com/batch`,
            {
              method: 'POST',
              headers: {
                Authorization: authHeader,
                'x-xbl-contract-version': '2',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                arrangebyfield: 'xuid',
                xuids: [xuid],
                stats: [{ name: 'MinutesPlayed', titleId: d4Title.titleId }],
              }),
            }
          );
          if (statsResp.ok) {
            const stJson = (await statsResp.json()) as {
              statlistscollection?: Array<{ stats?: Array<{ value?: string }> }>;
            };
            const mins = Number(stJson.statlistscollection?.[0]?.stats?.[0]?.value || 0);
            if (mins > 0) {
              diabloStats.hoursPlayed = Math.round((mins / 60) * 10) / 10;
            }
          }
        }
      }
    }

    const sid = crypto.randomBytes(24).toString('hex');
    xboxSessions.set(sid, {
      xuid,
      gamertag,
      gamerscore,
      avatarUrl,
      diabloStats,
      connectedAt: new Date().toISOString(),
    });

    res.cookie('d4_xbox_sid', sid, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.send(`
      <html>
        <body style="background:#0c0a09;color:#e7e5e4;font-family:sans-serif;padding:24px;">
          <h2 style="color:#f59e0b;">Xbox Account Connected</h2>
          <p>Signed in as <strong>${gamertag.replace(/</g, '&lt;')}</strong>. Returning to Diablo IV Druid Codex...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Xbox OAuth Callback Error:', err);
    sendPopupError(err instanceof Error ? err.message : 'Unexpected Xbox OAuth callback failure.');
  }
}

app.get(['/auth/xbox/callback', '/auth/xbox/callback/'], handleXboxCallback);

app.post('/api/auth/xbox/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies['d4_xbox_sid'];
  if (sid) xboxSessions.delete(sid);
  res.clearCookie('d4_xbox_sid', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ ok: true });
});

// ============================================================================
// DRUID SCREENSHOT STAT SCANNER (gemini-4-hydrogen Vision)
// ============================================================================

app.post('/api/scan-character', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };
    if (!imageBase64) {
      res.status(400).json({ error: 'A screenshot image is required.' });
      return;
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text:
              'Extract any visible Diablo IV character stats from this Xbox/PC game screenshot (Character Name, Level, Paragon Level, Armor, Attack Power, Maximum Life, Critical Strike Chance %, Critical Strike Damage %, Attack Speed Bonus %, Lowest Element Resistance %, and Wolves Skill Rank if shown). If a field is not visible in the screenshot, leave it null.',
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characterName: { type: Type.STRING, nullable: true },
            level: { type: Type.INTEGER, nullable: true },
            paragonLevel: { type: Type.INTEGER, nullable: true },
            armor: { type: Type.INTEGER, nullable: true },
            attackPower: { type: Type.INTEGER, nullable: true },
            maxLife: { type: Type.INTEGER, nullable: true },
            critChance: { type: Type.NUMBER, nullable: true },
            critDamage: { type: Type.NUMBER, nullable: true },
            attackSpeed: { type: Type.NUMBER, nullable: true },
            minResistance: { type: Type.NUMBER, nullable: true },
            wolvesRank: { type: Type.INTEGER, nullable: true },
            notes: { type: Type.STRING, nullable: true },
          },
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    res.json({ stats: parsed });
  } catch (err) {
    console.error('Scan Character Error:', err);
    const parsed = extractApiError(err);
    res.status(parsed.status).json({ error: parsed.message, requiresPaidKey: parsed.requiresPaidKey });
  }
});

// ============================================================================
// GOOGLE SEARCH GROUNDED META & PATCH ORACLE (gemini-4-hydrogen)
// ============================================================================

app.post('/api/search-meta', async (req, res) => {
  try {
    const { query, variant } = req.body as { query?: string; variant?: string };
    if (!query || !query.trim()) {
      res.status(400).json({ error: 'Query text is required.' });
      return;
    }

    const ai = getAiClient();
    const variantLabel =
      variant === 'speedfarm'
        ? 'Torment IV Speedfarm'
        : variant === 'starter_leveling'
        ? 'Starter / Torment Ready (No Mythics)'
        : 'Endgame Pit 100+ Push (Mythic BiS)';

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Diablo 4 Companion Druid query (Current loadout context: ${variantLabel}): ${query.trim()}`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'You are an expert Diablo IV endgame theorycrafter specializing in the Storm Wolf & Zoo Companion Druid build. Use Google Search to provide accurate, up-to-date Diablo 4 patch notes, Aspect scaling, Unique drop sources, Paragon glyph mechanics, and meta recommendations. Format your response cleanly with concise bullet points and exact item/aspect names.',
      },
    });

    const answer = response.text || 'No grounded summary returned.';
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: { title: string; uri: string }[] = [];
    const seen = new Set<string>();

    for (const chunk of rawChunks) {
      const web = (chunk as { web?: { uri?: string; title?: string } }).web;
      if (web?.uri && !seen.has(web.uri)) {
        seen.add(web.uri);
        sources.push({
          title: web.title || web.uri,
          uri: web.uri,
        });
      }
    }

    res.json({ answer, sources });
  } catch (err) {
    console.error('Search Meta Error:', err);
    const parsed = extractApiError(err);
    res.status(parsed.status).json({ error: parsed.message, requiresPaidKey: parsed.requiresPaidKey });
  }
});

// ============================================================================
// ANIMATE IMAGE INTO VIDEO (gemini-omni-1.2-flash via Interactions API)
// ============================================================================

app.post('/api/animate-video', async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt, aspectRatio } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      prompt?: string;
      aspectRatio?: string;
    };

    if (!imageBase64) {
      res.status(400).json({ error: 'An uploaded image is required.' });
      return;
    }

    const validAspectRatio: '16:9' | '9:16' = aspectRatio === '9:16' ? '9:16' : '16:9';
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const cleanMime = mimeType || 'image/jpeg';
    const motionPrompt =
      prompt?.trim() ||
      'Cinematic dark fantasy motion: lightning crackles through the storm wolves fur, mist drifts across the forest floor, embers rise slowly, subtle camera push-in.';

    const ai = getAiClient();

    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.2-flash',
        input: [
          {
            type: 'image',
            mime_type: cleanMime,
            data: cleanBase64,
          },
          {
            type: 'text',
            text: motionPrompt,
          },
        ],
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: validAspectRatio,
          duration: '5s',
          resolution: '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (!videoPart || (!videoPart.data && !videoPart.uri)) {
      res.status(502).json({
        error: 'Video generation completed without a playable video payload.',
      });
      return;
    }

    res.json({
      videoBase64: videoPart.data || null,
      videoUri: videoPart.uri || null,
      mimeType: videoPart.mime_type || 'video/mp4',
      aspectRatio: validAspectRatio,
    });
  } catch (err) {
    console.error('Animate Video Error:', err);
    const parsed = extractApiError(err);
    res.status(parsed.status).json({ error: parsed.message, requiresPaidKey: parsed.requiresPaidKey });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
