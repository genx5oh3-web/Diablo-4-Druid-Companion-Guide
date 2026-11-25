import React, { useState } from 'react';
import { Calculator, Zap, Sparkles, Skull, Flame, RefreshCw } from 'lucide-react';

export const CompanionDamageCalculator: React.FC = () => {
  // Inputs
  const [activeCompanions, setActiveCompanions] = useState<number>(7); // 3 Wolves + 3 Ravens + 1 Creeper
  const [shepherdPercentPerPet, setShepherdPercentPerPet] = useState<number>(15.0); // 15% on Amulet (or 10% on ring)
  const [wolvesRank, setWolvesRank] = useState<number>(16); // Base 5 + Pants 6 + Gloves 3 + Shako 2
  const [alphaAspectPercent, setAlphaAspectPercent] = useState<number>(128); // 100 - 130%
  const [critChance, setCritChance] = useState<number>(68); // %
  const [critDamage, setCritDamage] = useState<number>(450); // %
  const [vulnerableUptime, setVulnerableUptime] = useState<boolean>(true);
  const [doubleDamageChance, setDoubleDamageChance] = useState<number>(48); // % from tempering + masterwork

  // Calculations
  // Shepherd Multiplier: 1 + (activeCompanions * (shepherdPercentPerPet / 100))
  const shepherdMultiplier = 1 + activeCompanions * (shepherdPercentPerPet / 100);

  // Base wolf leap damage base scales sharply with ranks (approx 180% weapon damage at rank 5 up to 450% at rank 16)
  const baseLeapDamage = 28000 + (wolvesRank - 5) * 5500;

  // Alpha multiplier: 1 + (alphaAspectPercent / 100)
  const alphaMultiplier = 1 + alphaAspectPercent / 100;

  // Vuln multiplier: 1.2 base + add
  const vulnMultiplier = vulnerableUptime ? 1.45 : 1.0;

  // Average crit multiplier
  const avgCritMultiplier = 1 + (critChance / 100) * (critDamage / 100);

  // Double damage multiplier
  const doubleDmgMultiplier = 1 + doubleDamageChance / 100;

  // Single Wolf Leap Damage
  const singleWolfLeapHit = Math.round(
    baseLeapDamage * shepherdMultiplier * alphaMultiplier * vulnMultiplier * (1 + critDamage / 100) * 1.5
  );

  // Full Pack Leap (3 Wolves diving simultaneously with Storm Howl lightning)
  const fullPackLeapDamage = singleWolfLeapHit * 3;

  // Poison Creeper active burst calculation
  const baseCreeperDamage = 45000;
  const creeperBurstDamage = Math.round(
    baseCreeperDamage * shepherdMultiplier * vulnMultiplier * avgCritMultiplier * 1.3
  );

  // Estimated Packleader reset seconds (based on 68% crit and 20% Lucky Hit)
  const expectedResetTime = (1 / ((critChance / 100) * 0.2 * 1.6)).toFixed(1);

  return (
    <section id="calculator" className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-stone-800">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-wide">
          Companion DPS & Multiplier Simulator
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          Simulate real-time companion damage scaling across Shepherd stacks, Wolf ranks, and Aspect of the Alpha.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sliders */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-5">
          <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold flex items-center justify-between">
            <span>Build Parameters</span>
            <span className="text-amber-500 font-mono">Live Interactive Inputs</span>
          </div>

          {/* Active Companions */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-300">Active Companions (Stampede Max: 7)</span>
              <span className="font-bold text-amber-400">{activeCompanions} Pets</span>
            </div>
            <input
              type="range"
              min="2"
              max="7"
              value={activeCompanions}
              onChange={(e) => setActiveCompanions(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="text-[11px] text-stone-500 font-mono">
              3 Wolves (with Stampede) + 3 Ravens + 1 Poison Creeper
            </div>
          </div>

          {/* Shepherd Aspect % */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-300">Shepherd’s Bonus Per Companion</span>
              <span className="font-bold text-amber-400">+{shepherdPercentPerPet.toFixed(1)}% [x]</span>
            </div>
            <div className="flex gap-2">
              {[
                { label: 'Ring (10%)', val: 10.0 },
                { label: 'Amulet 150% (15%)', val: 15.0 },
                { label: '2H Weapon 200% (20%)', val: 20.0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setShepherdPercentPerPet(opt.val)}
                  className={`flex-1 py-1 px-2 rounded text-xs font-mono transition-colors cursor-pointer ${
                    shepherdPercentPerPet === opt.val
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wolves Skill Rank */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-300">Wolves Skill Rank (Storm’s Companion)</span>
              <span className="font-bold text-amber-400">Rank {wolvesRank}</span>
            </div>
            <input
              type="range"
              min="5"
              max="22"
              value={wolvesRank}
              onChange={(e) => setWolvesRank(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="text-[11px] text-stone-500 font-mono">
              Includes +6 from Masterworked Pants, +3 from Gloves, +4 from Shako
            </div>
          </div>

          {/* Aspect of the Alpha Roll */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-300">Aspect of the Alpha Roll</span>
              <span className="font-bold text-amber-400">+{alphaAspectPercent}% [x]</span>
            </div>
            <input
              type="range"
              min="100"
              max="130"
              value={alphaAspectPercent}
              onChange={(e) => setAlphaAspectPercent(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Double Damage Chance */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-300">Tempered Double Damage Chance</span>
              <span className="font-bold text-amber-400">{doubleDamageChance}% Chance</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={doubleDamageChance}
              onChange={(e) => setDoubleDamageChance(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Vulnerable & Reset */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-800">
            <label className="flex items-center gap-2 text-xs font-mono text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={vulnerableUptime}
                onChange={(e) => setVulnerableUptime(e.target.checked)}
                className="rounded accent-amber-500 cursor-pointer"
              />
              <span>Target Is Vulnerable (Applied by Ravens)</span>
            </label>
            <button
              onClick={() => {
                setActiveCompanions(7);
                setShepherdPercentPerPet(15.0);
                setWolvesRank(16);
                setAlphaAspectPercent(128);
                setCritChance(68);
                setCritDamage(450);
                setVulnerableUptime(true);
                setDoubleDamageChance(48);
              }}
              className="text-[11px] font-mono text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Defaults</span>
            </button>
          </div>
        </div>

        {/* Right Column: Calculated Outputs */}
        <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
          <div className="p-5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-4">
            <div className="text-xs uppercase tracking-wider text-amber-500 font-semibold font-mono">
              Calculated Damage Benchmarks
            </div>

            {/* Shepherd Multiplier Highlight */}
            <div className="p-4 rounded-lg bg-stone-950 border border-amber-900/40">
              <div className="text-xs text-stone-400 font-mono uppercase">
                Shepherd’s Global Multiplier ({activeCompanions} Companions)
              </div>
              <div className="text-3xl font-serif font-extrabold text-amber-400 mt-1 tabular-nums">
                +{((shepherdMultiplier - 1) * 100).toFixed(1)}% [x]
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Multiplies every single attack from your Wolves, Landslide procs, and Poison Creeper.
              </p>
            </div>

            {/* Wolf Pack Dive Damage */}
            <div className="p-4 rounded-lg bg-stone-950 border border-sky-900/40 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono uppercase">
                <span className="flex items-center gap-1 text-sky-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>3-Wolf Storm Leap Slam</span>
                </span>
                <span className="text-stone-400">Single Target Burst</span>
              </div>
              <div className="text-3xl font-serif font-extrabold text-sky-300 tabular-nums">
                {fullPackLeapDamage.toLocaleString()} Dmg
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                Individual Wolf Slam: ~{singleWolfLeapHit.toLocaleString()} (Rank {wolvesRank})
              </div>
            </div>

            {/* Poison Creeper Screen Wipe */}
            <div className="p-4 rounded-lg bg-stone-950 border border-purple-900/40 space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono uppercase">
                <span className="flex items-center gap-1 text-purple-400">
                  <Skull className="w-3.5 h-3.5" />
                  <span>Poison Creeper Active Strangle</span>
                </span>
                <span>AoE Poisoning</span>
              </div>
              <div className="text-2xl font-serif font-extrabold text-purple-300 tabular-nums">
                {creeperBurstDamage.toLocaleString()} Total Poison
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                Plus circular Landslide bursts via Subterranean Aspect
              </div>
            </div>

            {/* Packleader reset telemetry */}
            <div className="p-3 rounded-lg bg-stone-950/60 border border-stone-800 text-xs font-mono text-stone-400 flex items-center justify-between">
              <span>Expected Packleader Reset Cadence:</span>
              <strong className="text-emerald-400">Every ~{expectedResetTime}s in combat</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
