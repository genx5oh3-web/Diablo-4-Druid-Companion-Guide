import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  HelpCircle,
  Hammer,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { GearItem, BuildVariant } from '../types/druid';
import { GEAR_LOADOUTS } from '../data/druidBuildData';
import { IMAGES } from '../assets/images';

interface GearPlannerProps {
  variant: BuildVariant;
  onInspectItem: (item: GearItem) => void;
  acquiredItems: Record<string, boolean>;
  onToggleAcquired: (slotKey: GearItem['slotKey']) => void;
  masterworkLevels: Record<string, number>;
  onSetMasterworkLevel: (slotKey: GearItem['slotKey'], level: number) => void;
  onMarkAllAcquired: () => void;
  onResetAcquired: () => void;
}

export const GearPlanner: React.FC<GearPlannerProps> = ({
  variant,
  onInspectItem,
  acquiredItems,
  onToggleAcquired,
  masterworkLevels,
  onSetMasterworkLevel,
  onMarkAllAcquired,
  onResetAcquired,
}) => {
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const items = GEAR_LOADOUTS[variant] || GEAR_LOADOUTS.endgame_push;

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterRarity === 'all') return true;
    if (filterRarity === 'mythic') return item.rarity === 'Mythic Unique';
    if (filterRarity === 'unique') return item.rarity === 'Unique';
    if (filterRarity === 'legendary') return item.rarity === 'Legendary';
    return true;
  });

  // Calculate masterworking and acquired progress
  const acquiredCount = items.filter((item) => acquiredItems[item.slotKey]).length;
  const totalMasterworkRanks = items.reduce(
    (acc, item) => acc + (masterworkLevels[item.slotKey] || 0),
    0
  );
  const maxMasterworkRanks = items.length * 12; // 120 ranks
  const masterworkPercentage = Math.round((totalMasterworkRanks / maxMasterworkRanks) * 100);

  // Approximate materials needed
  const ranksRemaining = maxMasterworkRanks - totalMasterworkRanks;
  const neathironNeeded = Math.max(0, Math.round(ranksRemaining * 30));
  const ingolithNeeded = Math.max(0, Math.round(ranksRemaining * 50));
  const obduciteNeeded = Math.max(0, Math.round(ranksRemaining * 100));

  const getRarityBadgeStyle = (rarity: GearItem['rarity']) => {
    switch (rarity) {
      case 'Mythic Unique':
        return 'text-fuchsia-400 border-fuchsia-600/50 bg-fuchsia-950/40';
      case 'Unique':
        return 'text-amber-400 border-amber-600/50 bg-amber-950/40';
      case 'Legendary':
        return 'text-orange-400 border-orange-600/50 bg-orange-950/40';
      default:
        return 'text-stone-300 border-stone-700 bg-stone-900';
    }
  };

  return (
    <section id="gear" className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-wide">
            BiS Gear Loadout & Masterworking
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Optimized affixes, Greater Affix priorities, tempering crafts, and masterwork crits for all 10 slots.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-900 rounded-lg border border-stone-800 self-start sm:self-auto">
          {['all', 'mythic', 'unique', 'legendary'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterRarity(f)}
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                filterRarity === f
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {f === 'all' ? 'All Slots' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Crafting & Farm Progress Tracker Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-xl bg-stone-900/60 border border-stone-800">
        {/* Gear checklist stats */}
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
              Gear Farmed & Slotted
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {acquiredCount} / {items.length} Slots ({Math.round((acquiredCount / items.length) * 100)}%)
            </span>
          </div>

          <div className="w-full bg-stone-950 rounded-full h-2.5 overflow-hidden border border-stone-800">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(acquiredCount / items.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onMarkAllAcquired}
              className="text-[11px] font-mono text-stone-300 hover:text-amber-400 hover:underline cursor-pointer"
            >
              Mark All Acquired
            </button>
            <span className="text-stone-600 text-xs">·</span>
            <button
              onClick={onResetAcquired}
              className="text-[11px] font-mono text-stone-400 hover:text-stone-200 hover:underline cursor-pointer"
            >
              Reset Checklist
            </button>
          </div>
        </div>

        {/* Masterworking status */}
        <div className="md:col-span-7 space-y-3 md:border-l md:border-stone-800 md:pl-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
              <Hammer className="w-3.5 h-3.5 text-amber-500" />
              <span>Masterworking Completion</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {totalMasterworkRanks} / {maxMasterworkRanks} Ranks ({masterworkPercentage}%)
            </span>
          </div>

          <div className="w-full bg-stone-950 rounded-full h-2.5 overflow-hidden border border-stone-800">
            <div
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${masterworkPercentage}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-stone-400 flex flex-wrap gap-x-4 gap-y-1">
            <span>Mats Needed for 12/12:</span>
            <span className="text-amber-300">{neathironNeeded} Neathiron</span>
            <span className="text-stone-300">{ingolithNeeded} Ingolith</span>
            <span className="text-stone-400">{obduciteNeeded} Obducite</span>
          </div>
        </div>
      </div>

      {/* Grid of Gear Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const isAcquired = !!acquiredItems[item.slotKey];
          const currentMw = masterworkLevels[item.slotKey] ?? item.targetMasterworkLevel;

          return (
            <div
              key={item.slotKey}
              className={`p-4 rounded-xl border transition-all duration-200 relative flex flex-col justify-between ${
                isAcquired
                  ? 'bg-stone-900/80 border-stone-700 shadow-md'
                  : 'bg-stone-950/60 border-stone-800/90 opacity-90 hover:opacity-100 hover:border-stone-700'
              }`}
            >
              {/* Item Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-stone-400 uppercase tracking-wider mb-0.5">
                      <span>{item.slotName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-500/90 font-semibold">IP {item.itemPower}</span>
                    </div>
                    <button
                      onClick={() => onInspectItem(item)}
                      className="font-serif text-base sm:text-lg font-bold tracking-wide text-left text-stone-100 hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                    >
                      <span>{item.name}</span>
                      <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>

                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${getRarityBadgeStyle(
                      item.rarity
                    )}`}
                  >
                    {item.rarity}
                  </span>
                </div>

                {/* Aspect / Power summary */}
                <div className="p-2.5 rounded bg-stone-950/80 border border-stone-800/80 text-xs mb-3">
                  <div className="text-amber-400 font-semibold mb-0.5 flex items-center gap-1 font-serif">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{item.aspectOrUniqueEffect.title}</span>
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed line-clamp-2">
                    {item.aspectOrUniqueEffect.description}
                  </p>
                </div>

                {/* Priority Affixes Quick View */}
                <div className="space-y-1 mb-3 font-mono text-[11px]">
                  {item.affixes.slice(0, 3).map((affix, idx) => (
                    <div key={idx} className="flex justify-between text-stone-300">
                      <span className="flex items-center gap-1">
                        {affix.isGreaterAffix && (
                          <span className="text-amber-400 font-bold" title="Greater Affix">
                            ✦
                          </span>
                        )}
                        <span className="truncate max-w-[200px]">{affix.stat}</span>
                      </span>
                      <span className="font-semibold text-stone-100 tabular-nums">
                        {affix.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tempering Recipe Snippet */}
                {item.tempering && item.tempering.length > 0 && (
                  <div className="text-[11px] font-mono text-emerald-400/90 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30 mb-3 flex items-center justify-between">
                    <span className="truncate">Temper: {item.tempering[0].affix}</span>
                    <span className="text-emerald-500 text-[10px] shrink-0">
                      ({item.tempering[0].rollRange})
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Card Controls: Masterworking Slider & Acquired Status */}
              <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-3 text-xs">
                {/* Masterwork Ranks */}
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-[11px] text-stone-400">MW:</span>
                  <div className="flex items-center gap-0.5">
                    {[4, 8, 12].map((milestone) => (
                      <button
                        key={milestone}
                        onClick={() => onSetMasterworkLevel(item.slotKey, milestone)}
                        title={`Set to rank ${milestone}`}
                        className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer transition-colors ${
                          currentMw >= milestone
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                        }`}
                      >
                        {milestone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Acquired Toggle */}
                <button
                  onClick={() => onToggleAcquired(item.slotKey)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium text-xs transition-colors cursor-pointer ${
                    isAcquired
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-400'
                  }`}
                >
                  {isAcquired ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>In Stash</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5 text-stone-500" />
                      <span>Need To Farm</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Farming Callout */}
      <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-400">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Pants slot (<strong>Storm’s Companion</strong>) is the non-negotiable cornerstone. Farm <strong>The Beast in the Ice</strong> in Glacial Fissure using Distilled Fear.
          </span>
        </div>
        <button
          onClick={() => {
            const bossSection = document.getElementById('bosses');
            bossSection?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-amber-400 hover:text-amber-300 font-semibold underline whitespace-nowrap cursor-pointer"
        >
          View Boss Drop Tables →
        </button>
      </div>
    </section>
  );
};
