import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  LogOut,
  Trophy,
  Clock,
  Shield,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Info,
  Sliders,
} from 'lucide-react';

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

export interface DruidCharacterStats {
  characterName: string;
  level: number;
  paragonLevel: number;
  armor: number;
  attackPower: number;
  maxLife: number;
  critChance: number;
  critDamage: number;
  attackSpeed: number;
  minResistance: number;
  wolvesRank: number;
  lastSyncedLabel?: string;
}

const DEFAULT_CHARACTER_STATS: DruidCharacterStats = {
  characterName: '',
  level: 60,
  paragonLevel: 0,
  armor: 0,
  attackPower: 0,
  maxLife: 0,
  critChance: 0,
  critDamage: 0,
  attackSpeed: 0,
  minResistance: 0,
  wolvesRank: 5,
};

export const XboxProfileSection: React.FC = () => {
  const [configured, setConfigured] = useState<boolean>(false);
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [session, setSession] = useState<XboxSessionData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [copiedUri, setCopiedUri] = useState<boolean>(false);

  const [scanning, setScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [editingStats, setEditingStats] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [druidStats, setDruidStats] = useState<DruidCharacterStats>(() => {
    try {
      const saved = localStorage.getItem('d4_druid_character_stats');
      return saved ? { ...DEFAULT_CHARACTER_STATS, ...JSON.parse(saved) } : DEFAULT_CHARACTER_STATS;
    } catch {
      return DEFAULT_CHARACTER_STATS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('d4_druid_character_stats', JSON.stringify(druidStats));
    } catch {
      // ignore
    }
  }, [druidStats]);

  const fetchXboxStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/auth/xbox/status', { credentials: 'include' });
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setRedirectUri(data.redirectUri || '');
      setSession(data.session || null);
    } catch {
      // Keep UI functional even if status check fails
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchXboxStatus();

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setOauthError(null);
        fetchXboxStatus();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setOauthError(event.data.error || 'Xbox OAuth failed.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectXbox = async () => {
    setOauthError(null);
    try {
      const res = await fetch('/api/auth/xbox/url');
      const data = await res.json();
      if (!res.ok) {
        setOauthError(data.error || 'Could not initiate Xbox Live OAuth.');
        return;
      }

      const authWindow = window.open(data.url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        setOauthError('Popup blocked by browser. Please allow popups for this site and click Connect again.');
      }
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : 'Failed to start Xbox OAuth.');
    }
  };

  const handleDisconnectXbox = async () => {
    await fetch('/api/auth/xbox/logout', { method: 'POST', credentials: 'include' });
    setSession(null);
  };

  const handleCopyRedirectUri = () => {
    if (!redirectUri) return;
    navigator.clipboard.writeText(redirectUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const handleScanScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    setScanSuccess(null);
    setScanning(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const res = await fetch('/api/scan-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUrl,
            mimeType: file.type || 'image/jpeg',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to read character stats from screenshot.');
        }
        const s = data.stats || {};
        setDruidStats((prev) => ({
          ...prev,
          characterName: s.characterName ?? prev.characterName,
          level: s.level ?? prev.level,
          paragonLevel: s.paragonLevel ?? prev.paragonLevel,
          armor: s.armor ?? prev.armor,
          attackPower: s.attackPower ?? prev.attackPower,
          maxLife: s.maxLife ?? prev.maxLife,
          critChance: s.critChance ?? prev.critChance,
          critDamage: s.critDamage ?? prev.critDamage,
          attackSpeed: s.attackSpeed ?? prev.attackSpeed,
          minResistance: s.minResistance ?? prev.minResistance,
          wolvesRank: s.wolvesRank ?? prev.wolvesRank,
          lastSyncedLabel: `Imported from Xbox screenshot · ${new Date().toLocaleTimeString()}`,
        }));
        setScanSuccess('Character stats extracted from your screenshot and saved.');
      } catch (err) {
        setScanError(err instanceof Error ? err.message : 'Screenshot scan failed.');
      } finally {
        setScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const benchmarkChecks = [
    {
      label: 'Armor',
      current: druidStats.armor,
      target: 1000,
      unit: '',
      displayCurrent: druidStats.armor.toLocaleString(),
      displayTarget: '1,000 Cap',
    },
    {
      label: 'All Resistances (Min)',
      current: druidStats.minResistance,
      target: 70,
      unit: '%',
      displayCurrent: `${druidStats.minResistance}%`,
      displayTarget: '70%+ Cap',
    },
    {
      label: 'Crit Strike Chance',
      current: druidStats.critChance,
      target: 65,
      unit: '%',
      displayCurrent: `${druidStats.critChance}%`,
      displayTarget: '65%+ Target',
    },
    {
      label: 'Wolves Skill Rank',
      current: druidStats.wolvesRank,
      target: 16,
      unit: '',
      displayCurrent: `Rank ${druidStats.wolvesRank}`,
      displayTarget: 'Rank 16+ BiS',
    },
  ];

  return (
    <section id="xbox-account" className="space-y-6">
      <div className="pb-4 border-b border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-wide">
              Xbox Live Profile & Druid Character Status
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Link your real Xbox Live account for Gamertag, Diablo IV playtime, and achievements, and import live Druid stats from Xbox captures.
            </p>
          </div>
          {session && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected: {session.gamertag}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Real Xbox Live OAuth Panel */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-emerald-400" />
                <span>Xbox Live OAuth 2.0</span>
              </span>
              {session && (
                <button
                  onClick={handleDisconnectXbox}
                  className="text-xs font-mono text-stone-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              )}
            </div>

            {loadingStatus ? (
              <div className="py-8 flex items-center justify-center text-stone-400 text-xs font-mono gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Xbox session...</span>
              </div>
            ) : session ? (
              <div className="space-y-4">
                {/* Xbox Gamercard */}
                <div className="p-4 rounded-lg bg-stone-950 border border-emerald-800/50 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-stone-900 border border-stone-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {session.avatarUrl ? (
                      <img
                        src={session.avatarUrl}
                        alt={session.gamertag}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Gamepad2 className="w-7 h-7 text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-serif text-lg font-bold text-stone-100 truncate">
                      {session.gamertag}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 flex items-center gap-2 mt-0.5 tabular-nums">
                      <span>{session.gamerscore.toLocaleString()} G</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-stone-400">XUID {session.xuid.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>

                {/* Real Diablo IV Title Telemetry from Xbox Live */}
                {session.diabloStats.found ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                      <div className="p-3 rounded bg-stone-950 border border-stone-800">
                        <div className="text-stone-400 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>D4 Time Played</span>
                        </div>
                        <div className="text-base font-bold text-stone-100 mt-1 tabular-nums">
                          {session.diabloStats.hoursPlayed ? `${session.diabloStats.hoursPlayed} hrs` : 'Tracked on Xbox'}
                        </div>
                      </div>
                      <div className="p-3 rounded bg-stone-950 border border-stone-800">
                        <div className="text-stone-400 flex items-center gap-1 text-[11px]">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Achievements</span>
                        </div>
                        <div className="text-base font-bold text-stone-100 mt-1 tabular-nums">
                          {session.diabloStats.currentAchievements ?? 0} / {session.diabloStats.totalAchievements ?? 0}
                        </div>
                      </div>
                    </div>

                    {session.diabloStats.recentAchievements.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold font-mono">
                          Diablo IV Xbox Achievements
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                          {session.diabloStats.recentAchievements.map((ach, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded border text-xs flex items-center justify-between gap-2 ${
                                ach.unlocked
                                  ? 'bg-stone-950 border-amber-900/40 text-stone-200'
                                  : 'bg-stone-950/40 border-stone-800/60 text-stone-500'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{ach.name}</div>
                                <div className="text-[11px] text-stone-400 truncate">{ach.description}</div>
                              </div>
                              <span className="font-mono text-[11px] text-amber-400 shrink-0 tabular-nums">
                                {ach.unlocked ? `${ach.gamerscore}G` : 'Locked'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded bg-stone-950 border border-stone-800 text-xs text-stone-400 font-mono">
                    Xbox profile connected. Diablo IV was not found in your recent Xbox title history yet.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-stone-300 leading-relaxed">
                  Sign in with Microsoft OAuth to pull your real Xbox Gamertag, Gamerscore, Diablo IV hours played, and unlocked achievements directly from Xbox Live.
                </p>

                <button
                  onClick={handleConnectXbox}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Connect Xbox Account</span>
                </button>

                {!configured && (
                  <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-2 text-[11px] font-mono text-stone-400">
                    <div className="text-amber-400 font-semibold">
                      Azure App Setup Required for Live Xbox OAuth
                    </div>
                    <p className="leading-relaxed">
                      Add <strong className="text-stone-200">XBOX_CLIENT_ID</strong> and <strong className="text-stone-200">XBOX_CLIENT_SECRET</strong> in AI Studio Secrets with this Redirect URI:
                    </p>
                    {redirectUri && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded bg-stone-900 border border-stone-800">
                        <span className="truncate text-stone-300">{redirectUri}</span>
                        <button
                          onClick={handleCopyRedirectUri}
                          className="text-amber-400 hover:text-amber-300 shrink-0 cursor-pointer flex items-center gap-1"
                        >
                          {copiedUri ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUri ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {oauthError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{oauthError}</span>
              </div>
            )}
          </div>

          {/* Honest Blizzard API Boundary Notice */}
          <div className="p-3 rounded-lg bg-stone-950/90 border border-stone-800 text-[11px] text-stone-400 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong>API Transparency:</strong> Blizzard does not offer a public Web API (via Xbox Live or Battle.net) for live in-game Diablo IV Armor, Paragon level, or equipped gear. Use the Xbox Screenshot Scanner on the right to auto-import your exact in-game stats.
            </span>
          </div>
        </div>

        {/* Right: Druid Live Character Status + Xbox Screenshot Scanner */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>My Druid Character Status</span>
              </div>
              <div className="font-serif text-xl font-bold text-stone-100 mt-0.5">
                {druidStats.characterName ? druidStats.characterName : session ? `${session.gamertag}’s Druid` : 'Your Sanctuary Druid'}
                <span className="text-sm font-mono font-normal text-amber-400 ml-2 tabular-nums">
                  Lv.{druidStats.level} · Paragon {druidStats.paragonLevel}
                </span>
              </div>
              {druidStats.lastSyncedLabel && (
                <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                  {druidStats.lastSyncedLabel}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScanScreenshot}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan Xbox Screenshot</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditingStats((v) => !v)}
                className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>{editingStats ? 'Done' : 'Edit Stats'}</span>
              </button>
            </div>
          </div>

          {scanError && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {scanSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{scanSuccess}</span>
            </div>
          )}

          {/* Primary Stat Readouts or Editor */}
          {editingStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-stone-950 border border-stone-800 text-xs font-mono">
              {[
                { key: 'characterName', label: 'Character Name', type: 'text' },
                { key: 'level', label: 'Character Level', type: 'number' },
                { key: 'paragonLevel', label: 'Paragon Level', type: 'number' },
                { key: 'armor', label: 'Armor', type: 'number' },
                { key: 'attackPower', label: 'Attack Power', type: 'number' },
                { key: 'maxLife', label: 'Maximum Life', type: 'number' },
                { key: 'critChance', label: 'Crit Chance (%)', type: 'number' },
                { key: 'critDamage', label: 'Crit Damage (%)', type: 'number' },
                { key: 'attackSpeed', label: 'Attack Speed (%)', type: 'number' },
                { key: 'minResistance', label: 'Lowest Resist (%)', type: 'number' },
                { key: 'wolvesRank', label: 'Wolves Skill Rank', type: 'number' },
              ].map((field) => (
                <label key={field.key} className="space-y-1">
                  <span className="text-stone-400 block">{field.label}</span>
                  <input
                    type={field.type}
                    value={druidStats[field.key as keyof DruidCharacterStats] ?? ''}
                    onChange={(e) => {
                      const val =
                        field.type === 'number' ? Math.max(0, Number(e.target.value)) : e.target.value;
                      setDruidStats((prev) => ({
                        ...prev,
                        [field.key]: val,
                        lastSyncedLabel: `Manually updated · ${new Date().toLocaleTimeString()}`,
                      }));
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-stone-100 tabular-nums"
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              {[
                { label: 'Paragon Level', val: druidStats.paragonLevel.toLocaleString() },
                { label: 'Armor', val: druidStats.armor.toLocaleString() },
                { label: 'Attack Power', val: druidStats.attackPower.toLocaleString() },
                { label: 'Maximum Life', val: druidStats.maxLife.toLocaleString() },
                { label: 'Crit Chance', val: `${druidStats.critChance}%` },
                { label: 'Crit Damage', val: `${druidStats.critDamage}%` },
                { label: 'Attack Speed', val: `+${druidStats.attackSpeed}%` },
                { label: 'Wolves Rank', val: `Rank ${druidStats.wolvesRank}` },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1"
                >
                  <div className="text-[11px] text-stone-400">{stat.label}</div>
                  <div className="text-base font-bold text-stone-100 tabular-nums">{stat.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Torment IV Breakpoint Gap Analyzer */}
          <div className="space-y-2.5 pt-2 border-t border-stone-800">
            <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold font-mono">
              Torment IV Companion Build Readiness Check
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {benchmarkChecks.map((chk) => {
                const met = chk.current >= chk.target;
                const pct = Math.min(100, Math.round((chk.current / chk.target) * 100));
                return (
                  <div
                    key={chk.label}
                    className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300 font-semibold">{chk.label}</span>
                      <span className={met ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {met ? 'At Cap' : 'Upgrade Needed'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-900 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all ${met ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500 tabular-nums">
                      <span>Yours: {chk.displayCurrent}</span>
                      <span>Target: {chk.displayTarget}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
