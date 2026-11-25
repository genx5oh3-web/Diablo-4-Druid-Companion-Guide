import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BuildOverview } from './components/BuildOverview';
import { GearPlanner } from './components/GearPlanner';
import { SkillTreeSection } from './components/SkillTreeSection';
import { ParagonSection } from './components/ParagonSection';
import { CompanionDamageCalculator } from './components/CompanionDamageCalculator';
import { BossLootGuide } from './components/BossLootGuide';
import { MetaSearchSection } from './components/MetaSearchSection';
import { VideoAnimatorSection } from './components/VideoAnimatorSection';
import { XboxProfileSection } from './components/XboxProfileSection';
import { ItemDetailModal } from './components/ItemDetailModal';
import { StormWolfArenaGame } from './components/StormWolfArenaGame';
import { GearItem, BuildVariant } from './types/druid';
import { GEAR_LOADOUTS } from './data/druidBuildData';

export default function App() {
  const [appMode, setAppMode] = useState<'game' | 'codex'>('codex');
  const [activeSection, setActiveSection] = useState<string>('xbox-account');
  const [selectedVariant, setSelectedVariant] = useState<BuildVariant>('endgame_push');
  const [inspectedItem, setInspectedItem] = useState<GearItem | null>(null);

  // LocalStorage persistence for gear acquisition
  const [acquiredItems, setAcquiredItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('d4_druid_acquired');
      return saved ? JSON.parse(saved) : { pants: true, amulet: true, mainHand: true };
    } catch {
      return { pants: true, amulet: true, mainHand: true };
    }
  });

  // LocalStorage persistence for masterworking levels
  const [masterworkLevels, setMasterworkLevels] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('d4_druid_masterwork');
      return saved ? JSON.parse(saved) : { pants: 12, amulet: 12, mainHand: 12, helm: 8, chest: 8, gloves: 8 };
    } catch {
      return { pants: 12, amulet: 12, mainHand: 12, helm: 8, chest: 8, gloves: 8 };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('d4_druid_acquired', JSON.stringify(acquiredItems));
    } catch {
      // Ignore storage errors
    }
  }, [acquiredItems]);

  useEffect(() => {
    try {
      localStorage.setItem('d4_druid_masterwork', JSON.stringify(masterworkLevels));
    } catch {
      // Ignore storage errors
    }
  }, [masterworkLevels]);

  const handleToggleAcquired = (slotKey: GearItem['slotKey']) => {
    setAcquiredItems((prev) => ({
      ...prev,
      [slotKey]: !prev[slotKey],
    }));
  };

  const handleSetMasterworkLevel = (slotKey: GearItem['slotKey'], level: number) => {
    setMasterworkLevels((prev) => ({
      ...prev,
      [slotKey]: level,
    }));
  };

  const handleMarkAllAcquired = () => {
    const currentLoadout = GEAR_LOADOUTS[selectedVariant] || GEAR_LOADOUTS.endgame_push;
    const allTrue: Record<string, boolean> = {};
    currentLoadout.forEach((item) => {
      allTrue[item.slotKey] = true;
    });
    setAcquiredItems(allTrue);
  };

  const handleResetAcquired = () => {
    setAcquiredItems({});
  };

  if (appMode === 'game') {
    return <StormWolfArenaGame onOpenCodex={() => setAppMode('codex')} />;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col font-sans selection:bg-amber-900/60 selection:text-amber-100">
      {/* Navigation Header */}
      <Header
        onLaunchGame={() => setAppMode('game')}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* Build Overview Section */}
        <BuildOverview
          selectedVariant={selectedVariant}
          onSelectVariant={setSelectedVariant}
          onNavigateToGear={() => {
            setActiveSection('gear');
            const el = document.getElementById('gear');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Xbox Live OAuth Profile & Druid Live Character Status */}
        <XboxProfileSection />

        {/* Gear Planner & Masterworking Section */}
        <GearPlanner
          variant={selectedVariant}
          onInspectItem={(item) => setInspectedItem(item)}
          acquiredItems={acquiredItems}
          onToggleAcquired={handleToggleAcquired}
          masterworkLevels={masterworkLevels}
          onSetMasterworkLevel={handleSetMasterworkLevel}
          onMarkAllAcquired={handleMarkAllAcquired}
          onResetAcquired={handleResetAcquired}
        />

        {/* Skill Tree & Spirit Boons Section */}
        <SkillTreeSection />

        {/* Paragon Boards & Glyph Upgrades Section */}
        <ParagonSection />

        {/* Companion DPS & Multipliers Simulator */}
        <CompanionDamageCalculator />

        {/* Google Search Grounded Live Meta & Patch Oracle */}
        <MetaSearchSection variant={selectedVariant} />

        {/* Photo-to-Video Motion Studio (Interactions API) */}
        <VideoAnimatorSection />

        {/* Boss Drops & Target Farming Directory */}
        <BossLootGuide />
      </main>

      {/* Item Detail Tooltip Inspect Modal */}
      <ItemDetailModal
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        isAcquired={inspectedItem ? !!acquiredItems[inspectedItem.slotKey] : false}
        onToggleAcquired={handleToggleAcquired}
        masterworkLevel={
          inspectedItem
            ? masterworkLevels[inspectedItem.slotKey] ?? inspectedItem.targetMasterworkLevel
            : 0
        }
        onSetMasterworkLevel={handleSetMasterworkLevel}
      />

      {/* Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950 py-8 px-4 sm:px-6 lg:px-8 text-stone-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>Diablo IV Druid Companion Codex</div>
          <div className="flex items-center gap-4 text-stone-400">
            <button
              onClick={() => setAppMode('game')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              3D Storm Wolf Arena
            </button>
            <span aria-hidden="true">·</span>
            <span>Shepherd’s Multiplier</span>
            <span aria-hidden="true">·</span>
            <span>Packleader Resets</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
