import React from 'react';
import { Sparkles, Shield, Zap, Skull, Flame, ChevronRight, Activity } from 'lucide-react';
import { BUILD_VARIANTS } from '../data/druidBuildData';
import { BuildVariant } from '../types/druid';
import { IMAGES } from '../assets/images';

interface BuildOverviewProps {
  selectedVariant: BuildVariant;
  onSelectVariant: (variant: BuildVariant) => void;
  onNavigateToGear: () => void;
}

export const BuildOverview: React.FC<BuildOverviewProps> = ({
  selectedVariant,
  onSelectVariant,
  onNavigateToGear,
}) => {
  const currentVariant = BUILD_VARIANTS.find((v) => v.id === selectedVariant) || BUILD_VARIANTS[0];

  const coreMechanics = [
    {
      title: 'Shepherd’s Companion Multiplier',
      description: 'With Aspect of the Stampede granting +1 to all companions (3 Wolves, 3 Ravens, 1 Poison Creeper = 7 active companions), Shepherd’s Aspect on your Amulet infuses a monstrous +105% [x] multiplicative damage boost to all abilities.',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },
    {
      title: 'Storm’s Companion & Aspect of the Alpha',
      description: 'Your Wolves evolve into ferocious Werewolves that spread Rabies and deal Lightning damage. Activating the skill teleports the entire pack instantly into the target with an electrified dive slam.',
      icon: <Zap className="w-4 h-4 text-sky-400" />,
    },
    {
      title: 'Packleader Reset Engine',
      description: 'The Wolf Spirit Boon Packleader gives your Critical Strikes a 20% Lucky Hit chance to instantly reset all Companion cooldowns. High attack speed and critical strikes keep Wolves leaping continuously.',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
    },
    {
      title: 'Envenom & Subterranean Bursts',
      description: 'Poison Creeper immobilizes the entire screen and triggers Envenom for huge passive critical strike damage multipliers, while Subterranean erupts Landslide waves across the battlefield.',
      icon: <Skull className="w-4 h-4 text-purple-400" />,
    },
  ];

  const rotationSteps = [
    {
      step: '01',
      title: 'Initiate with Poison Creeper',
      desc: 'Immobilize approaching packs to trigger Envenom (+30% to +90% Crit Damage) and lock enemies in place.',
    },
    {
      step: '02',
      title: 'Cast Ravens Swarm',
      desc: 'Target the elite cluster with Ravens to immediately apply Vulnerable and gain +8% increased Critical Strike Chance.',
    },
    {
      step: '03',
      title: 'Command Wolves Lightning Dive',
      desc: 'Direct your storm werewolf pack to leap directly onto the prioritized elite or boss for massive single-target burst.',
    },
    {
      step: '04',
      title: 'Storm Strike Attack Cadence',
      desc: 'Weave Storm Strike to trigger Packleader resets, refresh Damage Reduction (15%), and chain lightning between mobs.',
    },
  ];

  const statPriorities = [
    { label: 'Armor Cap', value: '1,000 (Torment IV)', sub: 'Physical mitigation cap' },
    { label: 'All Resistances', value: '70.0% – 85.0%', sub: 'Max with Tyrael’s Might' },
    { label: 'Crit Strike Chance', value: '65.0%+', sub: 'Drives Packleader resets' },
    { label: 'Wolves Skill Rank', value: 'Rank 16 – 20', sub: 'Via Storm’s Companion' },
    { label: 'Attack Speed Bonus', value: '+45.0%+', sub: 'Fast bite & leap animations' },
    { label: 'Companion Multiplier', value: '+105% [x]', sub: '7 Active Companions' },
  ];

  return (
    <section id="overview" className="space-y-12">
      {/* Hero Banner Grid */}
      <div className="relative rounded-xl border border-stone-800 bg-stone-900/60 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[480px]">
          {/* Left Text Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6 z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
                <span>Sanctuary Build Codex</span>
                <span aria-hidden="true">·</span>
                <span>Tier S Endgame Guide</span>
                <span aria-hidden="true">·</span>
                <span>Season Validated</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-100 tracking-tight leading-tight" style={{ textWrap: 'balance' }}>
                Storm Wolf Companion Druid
              </h1>

              <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl font-sans">
                Unleash Sanctuary’s fiercest Zoo Druid pack. Transform your companions into lightning-infused Werewolf storm hounds that tear through high Torment Pit tiers with rapid Packleader cooldown resets and immense Shepherd multipliers.
              </p>
            </div>

            {/* Variant Segmented Control */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
                Select Build Variant
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-stone-950/80 rounded-lg border border-stone-800">
                {BUILD_VARIANTS.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => onSelectVariant(variant.id)}
                    className={`py-2 px-3 rounded text-xs font-medium text-left transition-all cursor-pointer ${
                      selectedVariant === variant.id
                        ? 'bg-amber-950/80 text-amber-200 border border-amber-600/60 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="truncate">{variant.label}</span>
                    </div>
                    <div className="text-[11px] text-stone-400 truncate mt-0.5">
                      {variant.tag}
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-xs text-stone-400 pt-1 font-mono">
                {currentVariant.description}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onNavigateToGear}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-950 bg-amber-500 hover:bg-amber-400 rounded transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-amber-950/40"
              >
                <span>Inspect Gear Loadout</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="text-xs text-stone-400 flex items-center gap-3">
                <span>Playstyle: <strong>High Mobility Melee / Pet Swarm</strong></span>
              </div>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-full">
            <img
              src={IMAGES.hero}
              alt="Diablo IV Druid Companion with lightning wolves"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            {/* Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent lg:bg-gradient-to-r lg:from-stone-950 lg:via-stone-950/20 lg:to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-stone-950/80 backdrop-blur-md rounded border border-stone-800 text-xs">
              <div className="flex items-center justify-between font-mono text-[11px] text-amber-400">
                <span>WOLF COMPANION STATUS</span>
                <span>INFUSED WITH STORM</span>
              </div>
              <div className="text-stone-300 mt-1">
                Werewolf Form · Lightning Slams · 3 Pack Count
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Stat Benchmarks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-100 tracking-wide">
            Torment IV Stat Breakpoints & Caps
          </h2>
          <span className="text-xs text-stone-400 font-mono">Endgame Target Benchmarks</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statPriorities.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-stone-900/60 border border-stone-800 space-y-1 hover:border-stone-700 transition-colors"
            >
              <div className="text-xs text-stone-400 font-medium">{item.label}</div>
              <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                {item.value}
              </div>
              <div className="text-[11px] text-stone-500 font-mono">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Build Synergies */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-100 tracking-wide">
          Core Engine & Synergy Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coreMechanics.map((mech, idx) => (
            <div
              key={idx}
              className="p-5 rounded-lg bg-stone-900/50 border border-stone-800/80 space-y-2 hover:border-stone-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                {mech.icon}
                <h3 className="text-sm font-semibold text-stone-100 font-serif tracking-wide">
                  {mech.title}
                </h3>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed font-sans">
                {mech.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Combat Cadence & Rotation */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-100 tracking-wide">
          Skill Cadence & Boss Rotation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rotationSteps.map((step) => (
            <div
              key={step.step}
              className="p-4 rounded-lg bg-stone-900/40 border border-stone-800 space-y-2"
            >
              <div className="font-mono text-xs text-amber-500 font-bold">
                {step.step}.
              </div>
              <div className="text-sm font-semibold text-stone-200">
                {step.title}
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
