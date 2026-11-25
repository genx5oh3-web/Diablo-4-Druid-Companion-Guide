import React from 'react';
import { X, Sparkles, Gem, Shield, Swords, RefreshCw, CheckCircle2 } from 'lucide-react';
import { GearItem } from '../types/druid';

interface ItemDetailModalProps {
  item: GearItem | null;
  onClose: () => void;
  isAcquired: boolean;
  onToggleAcquired: (slotKey: GearItem['slotKey']) => void;
  masterworkLevel: number;
  onSetMasterworkLevel: (slotKey: GearItem['slotKey'], level: number) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  isAcquired,
  onToggleAcquired,
  masterworkLevel,
  onSetMasterworkLevel,
}) => {
  if (!item) return null;

  const isMythic = item.rarity === 'Mythic Unique';
  const isUnique = item.rarity === 'Unique';

  // Rarity color schemes
  const rarityColors = {
    'Mythic Unique': {
      border: 'border-fuchsia-600/70',
      headerBg: 'bg-gradient-to-r from-fuchsia-950 via-purple-900 to-fuchsia-950',
      text: 'text-fuchsia-300',
      tag: 'text-fuchsia-400',
      glow: 'shadow-fuchsia-950/50',
    },
    Unique: {
      border: 'border-amber-600/70',
      headerBg: 'bg-gradient-to-r from-stone-900 via-amber-950/80 to-stone-900',
      text: 'text-amber-300',
      tag: 'text-amber-400',
      glow: 'shadow-amber-950/50',
    },
    Legendary: {
      border: 'border-orange-600/70',
      headerBg: 'bg-gradient-to-r from-stone-900 via-orange-950/80 to-stone-900',
      text: 'text-orange-300',
      tag: 'text-orange-400',
      glow: 'shadow-orange-950/50',
    },
    Rare: {
      border: 'border-yellow-600/70',
      headerBg: 'bg-stone-900',
      text: 'text-yellow-300',
      tag: 'text-yellow-400',
      glow: 'shadow-yellow-950/50',
    },
    Magic: {
      border: 'border-blue-600/70',
      headerBg: 'bg-stone-900',
      text: 'text-blue-300',
      tag: 'text-blue-400',
      glow: 'shadow-blue-950/50',
    },
  }[item.rarity];

  const handleSimulateCrit = () => {
    // Increase masterwork level to 4, 8, or 12
    if (masterworkLevel < 4) onSetMasterworkLevel(item.slotKey, 4);
    else if (masterworkLevel < 8) onSetMasterworkLevel(item.slotKey, 8);
    else if (masterworkLevel < 12) onSetMasterworkLevel(item.slotKey, 12);
    else onSetMasterworkLevel(item.slotKey, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-stone-950 border border-stone-800 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Diablo Header banner */}
        <div className={`p-4 border-b ${rarityColors.border} ${rarityColors.headerBg} relative`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-stone-400 mb-1">
                <span>Item Power {item.itemPower}</span>
                <span aria-hidden="true">·</span>
                <span>Ancestral {item.slotName}</span>
              </div>
              <h2 className={`font-serif text-xl sm:text-2xl font-bold tracking-wide ${rarityColors.text}`}>
                {item.name}
              </h2>
              <div className="text-xs uppercase tracking-wider font-semibold mt-0.5 text-stone-300">
                {item.rarity}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800/80 rounded transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Tooltip Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-stone-200 text-sm">
          {/* Implicit */}
          {item.implicit && (
            <div className="py-2 border-b border-stone-800/80 text-stone-300 text-xs font-mono">
              <span className="text-stone-400">[Implicit]</span> {item.implicit}
            </div>
          )}

          {/* Affixes Section */}
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-2 flex items-center justify-between">
              <span>Item Affixes</span>
              <span className="text-[11px] text-amber-500/90 font-mono">✦ = Greater Affix (150% Max Roll)</span>
            </div>
            <ul className="space-y-1.5 font-mono text-xs">
              {item.affixes.map((affix, idx) => (
                <li
                  key={idx}
                  className={`flex items-start justify-between py-1 px-2 rounded ${
                    affix.isGreaterAffix
                      ? 'bg-amber-950/30 text-amber-200 border border-amber-900/40'
                      : 'bg-stone-900/50 text-stone-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {affix.isGreaterAffix && <span className="text-amber-400 text-sm font-bold">✦</span>}
                    <span>{affix.stat}</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${affix.isGreaterAffix ? 'text-amber-400' : 'text-stone-100'}`}>
                    {affix.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Aspect or Unique Legendary Power */}
          <div className="p-3 rounded bg-stone-900/90 border border-stone-800">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-amber-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{item.aspectOrUniqueEffect.title}</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              {item.aspectOrUniqueEffect.description}
            </p>
            {item.aspectOrUniqueEffect.imprintSource && (
              <div className="mt-2 text-[11px] text-stone-500 font-mono">
                Source: {item.aspectOrUniqueEffect.imprintSource}
              </div>
            )}
          </div>

          {/* Tempering Crafts */}
          {item.tempering && item.tempering.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                Tempering Manual Crafts
              </div>
              <div className="grid grid-cols-1 gap-2">
                {item.tempering.map((craft, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-stone-900/60 border border-stone-800 text-xs font-mono">
                    <div className="text-stone-400 text-[11px] uppercase flex justify-between">
                      <span>{craft.category} · {craft.recipeName}</span>
                      <span className="text-stone-500">Roll: {craft.rollRange}</span>
                    </div>
                    <div className="text-emerald-400 font-medium mt-0.5">
                      + {craft.affix}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Masterworking Status & Simulator */}
          <div className="p-3 rounded bg-stone-900/80 border border-amber-900/30">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" />
                <span>Masterworking: Rank {masterworkLevel} / 12</span>
              </span>
              <button
                onClick={handleSimulateCrit}
                className="px-2.5 py-1 text-[11px] uppercase tracking-wider bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-amber-400" />
                <span>Test Rank Up</span>
              </button>
            </div>

            {/* 12 Masterwork Pips */}
            <div className="grid grid-cols-12 gap-1 mb-2">
              {Array.from({ length: 12 }).map((_, i) => {
                const rankNum = i + 1;
                const isCritRank = rankNum === 4 || rankNum === 8 || rankNum === 12;
                const isFilled = rankNum <= masterworkLevel;
                return (
                  <div
                    key={i}
                    onClick={() => onSetMasterworkLevel(item.slotKey, rankNum)}
                    title={`Rank ${rankNum} ${isCritRank ? '(+25% Critical Stat Upgrade)' : '(+5% All Stats)'}`}
                    className={`h-4 rounded-xs cursor-pointer transition-colors text-[9px] flex items-center justify-center font-mono font-bold ${
                      isFilled
                        ? isCritRank
                          ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/50'
                          : 'bg-stone-400 text-stone-950'
                        : isCritRank
                        ? 'border border-amber-500/60 bg-amber-950/30 text-amber-400'
                        : 'bg-stone-800 text-stone-600'
                    }`}
                  >
                    {isCritRank ? '✦' : ''}
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-stone-400 font-mono space-y-1">
              <div>
                <span className="text-stone-300 font-semibold">Priority Stat Target:</span> {item.masterworkingTarget}
              </div>
              <div className="text-amber-400/90">
                Crits Target: {item.masterworkCrits.join(' · ')}
              </div>
            </div>
          </div>

          {/* Sockets / Runewords */}
          {item.socket && (
            <div className="p-2.5 rounded bg-stone-900/50 border border-stone-800 text-xs">
              <div className="text-stone-400 text-[11px] uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                <Gem className="w-3.5 h-3.5 text-stone-400" />
                <span>{item.socket.type === 'runeword' ? 'Socketed Runeword' : 'Gems'}</span>
              </div>
              {item.socket.type === 'gem' ? (
                <div className="text-stone-300 font-mono">
                  <span className="text-amber-300">{item.socket.gemName}</span>: {item.socket.gemBonus}
                </div>
              ) : item.socket.runes ? (
                <div className="font-mono space-y-1 text-xs">
                  <div className="text-amber-300">
                    {item.socket.runes.ritualRune}: <span className="text-stone-300 font-normal">{item.socket.runes.ritualCondition}</span>
                  </div>
                  <div className="text-purple-300">
                    {item.socket.runes.invocationRune}: <span className="text-stone-300 font-normal">{item.socket.runes.invocationEffect}</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Target Farm Boss */}
          <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400 font-mono">
            <span>Target Farm: <strong className="text-stone-200">{item.targetFarmBoss}</strong></span>
            {item.alternativeItem && (
              <span className="text-stone-500">Alt: {item.alternativeItem}</span>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <button
            onClick={() => onToggleAcquired(item.slotKey)}
            className={`px-3 py-1.5 text-xs font-semibold rounded uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
              isAcquired
                ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/60'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isAcquired ? 'text-emerald-400' : 'text-stone-400'}`} />
            <span>{isAcquired ? 'Item In Inventory' : 'Mark As Acquired'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
