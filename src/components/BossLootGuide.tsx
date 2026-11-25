import React, { useState } from 'react';
import {
  Skull,
  MapPin,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import { BOSS_FARMING_GUIDE } from '../data/druidBuildData';
import { BossDropInfo } from '../types/druid';

export const BossLootGuide: React.FC = () => {
  const [selectedBoss, setSelectedBoss] = useState<BossDropInfo>(BOSS_FARMING_GUIDE[0]); // Beast in the ice default
  const [distilledFearCount, setDistilledFearCount] = useState<number>(18);
  const [exquisiteBloodCount, setExquisiteBloodCount] = useState<number>(27);
  const [livingSteelCount, setLivingSteelCount] = useState<number>(15);

  const beastInIceRuns = Math.floor(distilledFearCount / 9);
  const zirRuns = Math.floor(exquisiteBloodCount / 9);
  const grigoireRuns = Math.floor(livingSteelCount / 5);

  return (
    <section id="bosses" className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-stone-800">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-wide">
          Boss Loot & Target Farming Directory
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          Exact boss summoning materials, lair locations, and targeted Unique and Mythic drop tables.
        </p>
      </div>

      {/* Summon Material Ready Counter */}
      <div className="p-5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-wider text-stone-300 font-semibold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-500" />
            <span>Interactive Boss Summoning Stash Calculator</span>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            Tracks available boss attempts in your stash
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Distilled Fear */}
          <div className="p-3.5 rounded-lg bg-stone-950/80 border border-stone-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-sky-300 font-semibold">Distilled Fear (Beast)</span>
              <span className="text-stone-400">9 per run</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={distilledFearCount}
                onChange={(e) => setDistilledFearCount(Math.max(0, Number(e.target.value)))}
                className="w-20 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-sm font-mono text-stone-100"
              />
              <span className="text-xs font-mono text-amber-400 font-bold">
                = {beastInIceRuns} {beastInIceRuns === 1 ? 'Run' : 'Runs'}
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-mono">
              Drops Storm’s Companion Unique Pants!
            </div>
          </div>

          {/* Exquisite Blood */}
          <div className="p-3.5 rounded-lg bg-stone-950/80 border border-stone-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-red-300 font-semibold">Exquisite Blood (Zir)</span>
              <span className="text-stone-400">9 per run</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={exquisiteBloodCount}
                onChange={(e) => setExquisiteBloodCount(Math.max(0, Number(e.target.value)))}
                className="w-20 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-sm font-mono text-stone-100"
              />
              <span className="text-xs font-mono text-amber-400 font-bold">
                = {zirRuns} {zirRuns === 1 ? 'Run' : 'Runs'}
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-mono">
              Drops Mad Wolf’s Glee & Staff of Crone
            </div>
          </div>

          {/* Living Steel */}
          <div className="p-3.5 rounded-lg bg-stone-950/80 border border-stone-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-amber-300 font-semibold">Living Steel (Grigoire)</span>
              <span className="text-stone-400">5 per run</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={livingSteelCount}
                onChange={(e) => setLivingSteelCount(Math.max(0, Number(e.target.value)))}
                className="w-20 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-sm font-mono text-stone-100"
              />
              <span className="text-xs font-mono text-amber-400 font-bold">
                = {grigoireRuns} {grigoireRuns === 1 ? 'Run' : 'Runs'}
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-mono">
              Drops Hunter’s Zenith & Insatiable Fury
            </div>
          </div>
        </div>
      </div>

      {/* Boss Selector Grid & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Boss List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">
            Sanctuary Boss Encounters
          </div>

          <div className="space-y-2">
            {BOSS_FARMING_GUIDE.map((boss) => {
              const isSelected = selectedBoss.bossName === boss.bossName;
              const isCrucial = boss.bossName === 'The Beast in the Ice';

              return (
                <div
                  key={boss.bossName}
                  onClick={() => setSelectedBoss(boss)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-stone-900 border-amber-600/70 shadow-md'
                      : 'bg-stone-950/60 border-stone-800/80 hover:bg-stone-900/50 hover:border-stone-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif text-base font-bold text-stone-100 truncate">
                        {boss.bossName}
                      </span>
                      {isCrucial && (
                        <span className="text-[10px] font-mono uppercase bg-amber-950/60 text-amber-400 border border-amber-800/60 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          BiS Core
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 truncate font-mono">
                      {boss.title}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-amber-400 translate-x-1' : 'text-stone-600'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Boss Deep Breakdown */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-xl bg-stone-900/80 border border-stone-800 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
                <span>{selectedBoss.tormentTierMin}</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-100">
                {selectedBoss.bossName}
              </h3>
              <div className="text-xs text-stone-400 font-mono mt-0.5">
                {selectedBoss.title}
              </div>
            </div>

            {/* Location & Summoning Materials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-stone-950 border border-stone-800 space-y-1">
                <div className="text-stone-400 flex items-center gap-1.5 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dungeon Location</span>
                </div>
                <div className="text-stone-200">{selectedBoss.location}</div>
              </div>

              <div className="p-3 rounded bg-stone-950 border border-stone-800 space-y-1">
                <div className="text-stone-400 flex items-center gap-1.5 font-semibold">
                  <Skull className="w-3.5 h-3.5 text-amber-500" />
                  <span>Summoning Materials</span>
                </div>
                <div className="text-amber-400">{selectedBoss.summonMaterials}</div>
              </div>
            </div>

            {/* Companion Build Specific Drops */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Companion Druid Priority Targets</span>
              </div>
              <div className="space-y-1.5">
                {selectedBoss.companionBuildItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/40 text-xs font-mono text-amber-200"
                  >
                    ✦ {item}
                  </div>
                ))}
              </div>
            </div>

            {/* General Drop Pool */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                Complete Unique Drop Pool
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedBoss.keyDrops.map((drop, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-stone-950 text-stone-300 border border-stone-800 text-xs font-mono"
                  >
                    {drop}
                  </span>
                ))}
              </div>
            </div>

            {/* Mechanics Warning */}
            <div className="p-3.5 rounded-lg bg-stone-950 border border-stone-800 text-xs space-y-1">
              <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Tactical Fight Mechanics & Survival Tips:</span>
              </div>
              <p className="text-stone-400 leading-relaxed font-sans">
                {selectedBoss.mechanicsTip}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
