import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  Skull,
  Shield,
} from 'lucide-react';
import {
  StormWolfArenaCanvas,
  ArenaGamePhase,
  ArenaHudSnapshot,
  ArenaControlApi,
} from '../game3d/StormWolfArenaCanvas';
import { gameAudio } from '../audio/gameAudio';

interface StormWolfArenaGameProps {
  onOpenCodex: () => void;
}

const INITIAL_HUD: ArenaHudSnapshot = {
  hp: 100,
  maxHp: 100,
  spirit: 100,
  maxSpirit: 100,
  wave: 1,
  maxWaves: 5,
  score: 0,
  kills: 0,
  packleaderResets: 0,
  cdWolves: 0,
  cdCreeper: 0,
  cdRavens: 0,
  cdDash: 0,
  bannerText: null,
  enemiesRemaining: 0,
};

export const StormWolfArenaGame: React.FC<StormWolfArenaGameProps> = ({ onOpenCodex }) => {
  const [phase, setPhase] = useState<ArenaGamePhase>('TITLE');
  const [hud, setHud] = useState<ArenaHudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const apiRef = useRef<ArenaControlApi | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyH' && phase === 'PLAYING') {
        setDockCollapsed((prev) => !prev);
      } else if (e.code === 'KeyM') {
        setMuted((prev) => {
          const next = !prev;
          gameAudio.setMuted(next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    gameAudio.setMuted(next);
  };

  const handleStartHunt = () => {
    apiRef.current?.startNewRun();
    setPhase('PLAYING');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans">
      {/* Full-Bleed 3D WebGL Arena */}
      <StormWolfArenaCanvas
        phase={phase}
        onPhaseChange={setPhase}
        onHudUpdate={setHud}
        apiRef={apiRef}
      />

      {/* TITLE SCREEN OVERLAY */}
      {phase === 'TITLE' && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 pointer-events-none">
          {/* Top-Right Quick Utility */}
          <div className="flex items-center justify-end gap-3 pointer-events-auto">
            <button
              onClick={handleToggleMute}
              className="px-3 py-2 rounded bg-[#110f0e]/90 border border-stone-700/80 text-stone-300 hover:text-amber-400 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{muted ? 'Muted' : 'Audio On'}</span>
            </button>
            <button
              onClick={onOpenCodex}
              className="px-4 py-2 rounded bg-[#110f0e]/90 border border-amber-700/60 text-amber-300 hover:bg-stone-900 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Build Codex</span>
            </button>
          </div>

          {/* Center-Left Title Lockup leaving calm negative space for 3D Druid & Wolves */}
          <div className="max-w-xl space-y-6 pointer-events-auto my-auto">
            {/* Bespoke Inline SVG Title Lockup */}
            <svg
              viewBox="0 0 540 135"
              className="w-full max-w-[490px] h-auto drop-shadow-[0_6px_22px_rgba(0,0,0,0.9)]"
              role="img"
              aria-label="Storm Pack Sanctuary Arena"
            >
              <defs>
                <linearGradient id="goldTitleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#92400e" />
                </linearGradient>
                <linearGradient id="stormLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <text
                x="4"
                y="24"
                fill="#38bdf8"
                fontSize="12"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="4"
                fontWeight="600"
              >
                SCOSGLEN 3D COMPANION TRIAL
              </text>
              <text
                x="2"
                y="74"
                fill="url(#goldTitleGrad)"
                fontSize="46"
                fontFamily="Cinzel, serif"
                fontWeight="800"
                letterSpacing="2"
              >
                STORM PACK
              </text>
              <rect x="2" y="86" width="380" height="2" fill="url(#stormLineGrad)" />
              <text
                x="4"
                y="114"
                fill="#e7e5e4"
                fontSize="22"
                fontFamily="Cinzel, serif"
                fontWeight="600"
                letterSpacing="5"
              >
                SANCTUARY ARENA
              </text>
            </svg>

            <p className="text-sm text-stone-300 leading-relaxed max-w-md bg-[#0c0a09]/80 p-3.5 rounded border border-stone-800/80">
              Command three lightning-infused Werewolf companions, root corrupted hordes with Poison Creeper, and trigger Packleader cooldown resets across five Torment waves.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleStartHunt}
                className="px-6 py-3 rounded bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Enter the Hunt</span>
              </button>
              <button
                onClick={onOpenCodex}
                className="px-5 py-3 rounded bg-[#141210]/95 hover:bg-stone-800 text-stone-200 border border-stone-700 font-semibold text-sm tracking-wide flex items-center gap-2 cursor-pointer transition-colors"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Build Codex · Gear · Video</span>
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <div className="text-xs font-mono text-stone-300 bg-[#0c0a09]/85 border border-stone-800/80 px-4 py-2 rounded self-start">
            WASD Move · Click / J Storm Strike · 1 Wolves Leap · 2 Poison Creeper · 3 Ravens · Space Dash · Enter Start
          </div>
        </div>
      )}

      {/* ACTIVE PLAYING HUD (Low-Occlusion Perimeter Clusters, zero backdrop-filter) */}
      {phase === 'PLAYING' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-5">
          {/* Top Perimeter Row */}
          <div className="flex items-start justify-between gap-4">
            {/* Top-Left Vitals Cluster */}
            <div className="bg-[#0c0a09]/90 border border-stone-800 rounded-lg p-3 w-64 space-y-2 pointer-events-auto">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-red-400 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Life</span>
                </span>
                <span className="text-stone-100 tabular-nums font-bold">
                  {hud.hp} / {hud.maxHp}
                </span>
              </div>
              <div className="w-full h-2 bg-stone-900 rounded overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-red-600 transition-all duration-100"
                  style={{ width: `${Math.max(0, (hud.hp / hud.maxHp) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-0.5">
                <span className="text-sky-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Spirit</span>
                </span>
                <span className="text-stone-200 tabular-nums">
                  {hud.spirit} / {hud.maxSpirit}
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-900 rounded overflow-hidden border border-stone-800">
                <div
                  className="h-full bg-sky-500 transition-all duration-100"
                  style={{ width: `${Math.max(0, (hud.spirit / hud.maxSpirit) * 100)}%` }}
                />
              </div>
            </div>

            {/* Center Wave Banner */}
            {hud.bannerText && (
              <div className="hidden md:block bg-[#0c0a09]/92 border border-amber-600/60 px-5 py-2 rounded text-center">
                <span className="font-serif text-sm font-bold tracking-widest text-amber-400">
                  {hud.bannerText}
                </span>
              </div>
            )}

            {/* Top-Right Encounter & Utility Cluster */}
            <div className="flex items-start gap-2 pointer-events-auto">
              <div className="bg-[#0c0a09]/90 border border-stone-800 rounded-lg px-3.5 py-2 text-xs font-mono space-y-1 text-right">
                <div className="text-amber-400 font-bold tabular-nums">
                  Wave {hud.wave}/{hud.maxWaves} · {hud.enemiesRemaining} Left
                </div>
                <div className="text-stone-300 tabular-nums">
                  Score {hud.score.toLocaleString()} · Kills {hud.kills}
                </div>
                <div className="text-sky-400 text-[11px] tabular-nums">
                  Packleader Resets: {hud.packleaderResets}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setPhase('PAUSED')}
                  className="p-2 rounded bg-[#0c0a09]/90 border border-stone-800 text-stone-300 hover:text-amber-400 cursor-pointer"
                  title="Pause (Esc)"
                  aria-label="Pause game"
                >
                  <Pause className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggleMute}
                  className="p-2 rounded bg-[#0c0a09]/90 border border-stone-800 text-stone-300 hover:text-amber-400 cursor-pointer"
                  title="Mute Audio (M)"
                  aria-label="Toggle audio"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Collapsible Skill & Control Dock */}
          <div className="flex flex-col items-center pointer-events-auto">
            <button
              onClick={() => setDockCollapsed((c) => !c)}
              className="mb-1.5 px-3 py-1 rounded bg-[#0c0a09]/90 border border-stone-800 text-[11px] font-mono text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{dockCollapsed ? 'Show Skills (H)' : 'Hide Skills (H)'}</span>
            </button>

            {!dockCollapsed && (
              <div className="bg-[#0c0a09]/92 border border-stone-800 rounded-xl px-3 py-2.5 flex items-center gap-2 sm:gap-3 shadow-2xl max-w-[94vw] overflow-x-auto">
                {[
                  {
                    key: 'Click / J',
                    label: 'Storm Strike',
                    cd: 0,
                    color: 'border-sky-700/70 text-sky-300',
                    action: () => apiRef.current?.triggerSkill('basic'),
                  },
                  {
                    key: '1',
                    label: 'Wolves Leap',
                    cd: hud.cdWolves,
                    color: 'border-amber-600/80 text-amber-300',
                    action: () => apiRef.current?.triggerSkill(1),
                  },
                  {
                    key: '2',
                    label: 'Poison Creeper',
                    cd: hud.cdCreeper,
                    color: 'border-emerald-700/80 text-emerald-300',
                    action: () => apiRef.current?.triggerSkill(2),
                  },
                  {
                    key: '3',
                    label: 'Ravens Swarm',
                    cd: hud.cdRavens,
                    color: 'border-purple-700/80 text-purple-300',
                    action: () => apiRef.current?.triggerSkill(3),
                  },
                  {
                    key: 'Space',
                    label: 'Evade Dash',
                    cd: hud.cdDash,
                    color: 'border-stone-600 text-stone-200',
                    action: () => apiRef.current?.triggerSkill('dash'),
                  },
                ].map((skill) => {
                  const onCd = skill.cd > 0.05;
                  return (
                    <button
                      key={skill.label}
                      onClick={skill.action}
                      className={`relative px-3 py-2 rounded-lg bg-stone-900 border text-left min-w-[104px] transition-colors cursor-pointer ${
                        onCd
                          ? 'border-stone-800 text-stone-500'
                          : `${skill.color} hover:bg-stone-800`
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                        <span className="font-bold">{skill.key}</span>
                        {onCd ? (
                          <span className="text-amber-400 tabular-nums font-bold">
                            {skill.cd.toFixed(1)}s
                          </span>
                        ) : (
                          <span className="text-emerald-400">Ready</span>
                        )}
                      </div>
                      <div className="text-xs font-semibold truncate mt-0.5">{skill.label}</div>
                    </button>
                  );
                })}

                <div className="h-8 w-px bg-stone-800 mx-1 hidden sm:block" />

                <button
                  onClick={onOpenCodex}
                  className="px-3 py-2 rounded-lg bg-amber-950/70 hover:bg-amber-900/70 border border-amber-700/60 text-amber-300 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Build Codex</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAUSED / VICTORY / GAME OVER MODAL */}
      {(phase === 'PAUSED' || phase === 'VICTORY' || phase === 'GAMEOVER') && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-stone-950 border border-stone-800 rounded-xl p-6 space-y-5 shadow-2xl">
            <div className="space-y-1 text-center">
              <div className="text-xs font-mono uppercase tracking-widest text-amber-500">
                {phase === 'PAUSED'
                  ? 'Sanctuary Paused'
                  : phase === 'VICTORY'
                  ? 'Pit Guardian Defeated'
                  : 'Fallen in Scosglen'}
              </div>
              <h2 className="font-serif text-3xl font-bold text-stone-100">
                {phase === 'PAUSED'
                  ? 'Hunt Suspended'
                  : phase === 'VICTORY'
                  ? 'Pack Triumphant'
                  : 'The Pack Rests'}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-stone-900 border border-stone-800 text-center font-mono">
              <div>
                <div className="text-[11px] text-stone-400">Wave</div>
                <div className="text-base font-bold text-amber-400 tabular-nums">
                  {hud.wave}/{hud.maxWaves}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-stone-400">Score</div>
                <div className="text-base font-bold text-stone-100 tabular-nums">
                  {hud.score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-stone-400">Resets</div>
                <div className="text-base font-bold text-sky-400 tabular-nums">
                  {hud.packleaderResets}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {phase === 'PAUSED' && (
                <button
                  onClick={() => setPhase('PLAYING')}
                  className="w-full py-2.5 px-4 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Hunt</span>
                </button>
              )}

              <button
                onClick={handleStartHunt}
                className={`w-full py-2.5 px-4 rounded font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                  phase === 'PAUSED'
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{phase === 'PAUSED' ? 'Restart Wave 1' : 'Play Again'}</span>
              </button>

              <button
                onClick={onOpenCodex}
                className="w-full py-2.5 px-4 rounded bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-800/60 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open Companion Build Codex</span>
              </button>

              <button
                onClick={() => setPhase('TITLE')}
                className="w-full py-2 px-4 rounded text-stone-400 hover:text-stone-200 text-xs font-mono cursor-pointer"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
