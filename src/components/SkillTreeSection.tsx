import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Activity,
  Sparkles,
  ChevronRight,
  Info,
  Check,
  Flame,
} from 'lucide-react';
import { SKILL_TREE_DATA, SPIRIT_BOONS_DATA } from '../data/druidBuildData';
import { SkillNode, SpiritBoonCategory } from '../types/druid';

export const SkillTreeSection: React.FC = () => {
  const [skills, setSkills] = useState<SkillNode[]>(SKILL_TREE_DATA);
  const [spiritBoons, setSpiritBoons] = useState<SpiritBoonCategory[]>(SPIRIT_BOONS_DATA);
  const [selectedSkill, setSelectedSkill] = useState<SkillNode>(SKILL_TREE_DATA[3]); // Wolves default

  // Calculate points allocated
  const totalSkillPoints = skills.reduce((acc, s) => acc + s.points, 0);

  const handlePointChange = (skillId: string, delta: number) => {
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id !== skillId) return s;
        const newPoints = Math.max(0, Math.min(s.maxPoints, s.points + delta));
        return { ...s, points: newPoints };
      })
    );
  };

  const handleToggleBoon = (animal: SpiritBoonCategory['animal'], boonId: string) => {
    setSpiritBoons((prev) =>
      prev.map((cat) => {
        if (cat.animal !== animal) return cat;

        // If bonded, allows up to 2 boons. If not bonded, only 1.
        const currentSelectedCount = cat.boons.filter((b) => b.selected).length;
        const targetBoon = cat.boons.find((b) => b.id === boonId);
        const isCurrentlySelected = !!targetBoon?.selected;

        if (isCurrentlySelected) {
          // Deselect
          return {
            ...cat,
            boons: cat.boons.map((b) => (b.id === boonId ? { ...b, selected: false } : b)),
          };
        } else {
          // Select target
          if (cat.isBonded) {
            if (currentSelectedCount >= 2) {
              // Unselect the first selected and select this one
              let unselectedFirst = false;
              return {
                ...cat,
                boons: cat.boons.map((b) => {
                  if (b.id === boonId) return { ...b, selected: true };
                  if (b.selected && !unselectedFirst) {
                    unselectedFirst = true;
                    return { ...b, selected: false };
                  }
                  return b;
                }),
              };
            } else {
              return {
                ...cat,
                boons: cat.boons.map((b) => (b.id === boonId ? { ...b, selected: true } : b)),
              };
            }
          } else {
            // Not bonded: single select only
            return {
              ...cat,
              boons: cat.boons.map((b) => ({ ...b, selected: b.id === boonId })),
            };
          }
        }
      })
    );
  };

  // Skill Bar Slot Layout
  const skillBarSlots = [
    { key: '1', name: 'Earthen Bulwark', type: 'Defensive', icon: '🛡️', role: 'Unstoppable & Fortify' },
    { key: '2', name: 'Blood Howl', type: 'Defensive', icon: '🐺', role: 'Heal & Attack Speed' },
    { key: '3', name: 'Poison Creeper', type: 'Companion', icon: '🌿', role: 'Screen Root & Envenom' },
    { key: '4', name: 'Ravens', type: 'Companion', icon: '🦅', role: 'Vulnerability Swarm' },
    { key: 'L-Click', name: 'Storm Strike', type: 'Basic', icon: '⚡', role: 'Lucky Hit Reset Engine' },
    { key: 'R-Click', name: 'Wolves', type: 'Companion', icon: '⚡🐺', role: 'Lightning Leap Slam' },
  ];

  return (
    <section id="skills" className="space-y-10">
      {/* Section Header */}
      <div className="pb-4 border-b border-stone-800">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-wide">
          Skill Tree & Spirit Boons Altar
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          Skill point distribution, active upgrades, key passives, and Tur Dulra spirit bindings.
        </p>
      </div>

      {/* Action Bar HUD Preview */}
      <div className="p-5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-stone-200 uppercase tracking-wider">
              Equipped Action Bar Loadout
            </span>
            <span className="text-xs text-stone-500 font-mono">· 6 Active Skills</span>
          </div>
          <div className="text-xs font-mono text-amber-400">
            Total Points Allocated: <strong>{totalSkillPoints} / 58</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {skillBarSlots.map((slot) => (
            <div
              key={slot.key}
              className="p-3 rounded-lg bg-stone-950/90 border border-stone-800/90 flex flex-col justify-between hover:border-amber-600/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-1">
                <span className="font-bold text-amber-500 bg-stone-900 px-1.5 py-0.5 rounded text-[10px]">
                  {slot.key}
                </span>
                <span className="text-[10px] uppercase text-stone-500">{slot.type}</span>
              </div>
              <div className="font-serif text-sm font-semibold text-stone-100 truncate">
                {slot.name}
              </div>
              <div className="text-[11px] text-stone-400 truncate mt-1 font-mono">
                {slot.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Skill List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-2">
            Skill Points & Passive Allocation
          </div>

          <div className="space-y-2">
            {skills.map((skill) => {
              const isSelected = selectedSkill.id === skill.id;
              const isMaxed = skill.points === skill.maxPoints;

              return (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-stone-900 border-amber-600/70 shadow-md'
                      : 'bg-stone-950/50 border-stone-800/80 hover:bg-stone-900/50 hover:border-stone-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs uppercase tracking-wider font-mono text-stone-400">
                        {skill.category}
                      </span>
                      {skill.category === 'Companion' && (
                        <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-900/40 font-mono">
                          Core Damage
                        </span>
                      )}
                    </div>
                    <div className="font-serif text-sm sm:text-base font-bold text-stone-100 truncate">
                      {skill.name}
                    </div>
                    <div className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                      {skill.description}
                    </div>
                  </div>

                  {/* Points Stepper */}
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handlePointChange(skill.id, -1)}
                      disabled={skill.points <= 0}
                      className="w-7 h-7 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none text-stone-200 font-bold flex items-center justify-center text-xs cursor-pointer transition-colors"
                      aria-label="Decrease points"
                    >
                      -
                    </button>
                    <span
                      className={`w-10 text-center font-mono font-bold text-xs tabular-nums ${
                        isMaxed ? 'text-amber-400' : 'text-stone-300'
                      }`}
                    >
                      {skill.points}/{skill.maxPoints}
                    </span>
                    <button
                      onClick={() => handlePointChange(skill.id, 1)}
                      disabled={skill.points >= skill.maxPoints}
                      className="w-7 h-7 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:pointer-events-none text-stone-200 font-bold flex items-center justify-center text-xs cursor-pointer transition-colors"
                      aria-label="Increase points"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Selected Skill Tooltip Inspector */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 p-5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-xs uppercase font-mono text-stone-400 mb-1">
                <span>{selectedSkill.category} Skill</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400 font-bold">
                  Rank {selectedSkill.points} / {selectedSkill.maxPoints}
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-100">
                {selectedSkill.name}
              </h3>
            </div>

            <div className="text-xs text-stone-300 leading-relaxed font-sans">
              {selectedSkill.description}
            </div>

            {selectedSkill.activeModifier && (
              <div className="p-3 rounded bg-stone-950 border border-stone-800 space-y-1">
                <div className="text-xs font-semibold text-amber-400 font-serif">
                  Enhanced Modifier
                </div>
                <div className="text-xs text-stone-300">
                  {selectedSkill.activeModifier}
                </div>
              </div>
            )}

            {selectedSkill.secondaryModifier && (
              <div className="p-3 rounded bg-stone-950 border border-stone-800 space-y-1">
                <div className="text-xs font-semibold text-sky-400 font-serif">
                  Branch Upgrade Choice
                </div>
                <div className="text-xs text-stone-300">
                  {selectedSkill.secondaryModifier}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-stone-800/80 text-[11px] text-stone-500 font-mono">
              Tip: Click the +/- buttons on any skill row to recalculate your 58-point distribution.
            </div>
          </div>
        </div>
      </div>

      {/* Druid Spirit Boons (Tur Dulra) */}
      <div className="space-y-4 pt-6 border-t border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-100 tracking-wide">
              Druidic Spirit Boons (Tur Dulra Altar)
            </h3>
            <p className="text-xs text-stone-400">
              Bond with the <strong>Eagle Spirit</strong> to unlock 2 concurrent boons (+Attack Speed & +Crit Chance).
            </p>
          </div>
          <span className="text-xs font-mono text-amber-500 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-800/40 self-start sm:self-auto">
            Bonded Spirit: Eagle (+2 Boons Active)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {spiritBoons.map((category) => (
            <div
              key={category.animal}
              className="p-4 rounded-xl bg-stone-900/50 border border-stone-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-serif text-base font-bold text-stone-100">
                    {category.animal} Spirit
                  </h4>
                  {category.isBonded && (
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-400 bg-stone-900 px-1.5 py-0.5 rounded border border-amber-600/40">
                      Spirit Bonded
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {category.boons.map((boon) => (
                    <button
                      key={boon.id}
                      onClick={() => handleToggleBoon(category.animal, boon.id)}
                      className={`w-full p-2.5 rounded text-left transition-all text-xs cursor-pointer ${
                        boon.selected
                          ? 'bg-amber-950/70 border border-amber-600/70 text-stone-100 shadow-xs'
                          : 'bg-stone-950/70 border border-stone-800/60 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-0.5">
                        <span className={boon.selected ? 'text-amber-400' : 'text-stone-300'}>
                          {boon.name}
                        </span>
                        {boon.selected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-stone-400 leading-snug">
                        {boon.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-stone-500 font-mono pt-1 border-t border-stone-800/60">
                {category.isBonded
                  ? 'Select 2 Boons (Spirit Bonded)'
                  : 'Select 1 Active Boon'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
