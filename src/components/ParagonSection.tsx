import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Zap,
  Target,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PARAGON_BOARDS_DATA } from '../data/druidBuildData';
import { ParagonBoardData, ParagonNode } from '../types/druid';

export const ParagonSection: React.FC = () => {
  const [boards, setBoards] = useState<ParagonBoardData[]>(PARAGON_BOARDS_DATA);
  const [activeBoardId, setActiveBoardId] = useState<string>('board_1');
  const [glyphLevels, setGlyphLevels] = useState<Record<string, number>>({
    board_1: 100,
    board_2: 100,
    board_3: 100,
    board_4: 100,
    board_5: 100,
  });
  const [selectedNode, setSelectedNode] = useState<ParagonNode | null>(
    PARAGON_BOARDS_DATA[0].nodesGrid[3] // Socket node default
  );

  const currentBoard = boards.find((b) => b.id === activeBoardId) || boards[0];
  const currentGlyphLevel = glyphLevels[activeBoardId] ?? 100;

  // Toggle node allocation
  const handleToggleNode = (nodeId: string) => {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== activeBoardId) return b;
        return {
          ...b,
          nodesGrid: b.nodesGrid.map((n) =>
            n.id === nodeId ? { ...n, allocated: !n.allocated } : n
          ),
        };
      })
    );
  };

  const handleSetGlyphLevel = (boardId: string, level: number) => {
    setGlyphLevels((prev) => ({ ...prev, [boardId]: level }));
  };

  const totalPointsAcrossBoards = boards.reduce(
    (acc, b) => acc + b.totalPointsAllocated,
    0
  );

  const getNodeColor = (type: ParagonNode['type'], allocated: boolean) => {
    if (!allocated) return 'bg-stone-900 border-stone-800 text-stone-600';
    switch (type) {
      case 'glyph_socket':
        return 'bg-purple-950 border-purple-500 text-purple-200 shadow-sm shadow-purple-500/30';
      case 'legendary':
        return 'bg-amber-950 border-amber-500 text-amber-200 shadow-sm shadow-amber-500/30';
      case 'rare':
        return 'bg-yellow-950 border-yellow-500 text-yellow-200';
      case 'magic':
        return 'bg-blue-950 border-blue-500 text-blue-200';
      default:
        return 'bg-stone-800 border-stone-700 text-stone-300';
    }
  };

  return (
    <section id="paragon" className="space-y-8">
      {/* Section Header */}
      <div className="pb-4 border-b border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-wide">
              Paragon Boards & Glyph Upgrades
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              5-Board pathing, Legendary Nodes, and Glyph leveling thresholds for maximum companion scaling.
            </p>
          </div>
          <div className="text-xs font-mono text-amber-400 bg-stone-900 px-3 py-1.5 rounded border border-stone-800 self-start sm:self-auto">
            Total Allocated: <strong>{totalPointsAcrossBoards} / 225 Points</strong>
          </div>
        </div>
      </div>

      {/* Board Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-stone-900/80 rounded-xl border border-stone-800">
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => {
              setActiveBoardId(b.id);
              setSelectedNode(b.nodesGrid[3] || b.nodesGrid[0]);
            }}
            className={`p-2.5 rounded-lg text-left transition-all cursor-pointer ${
              activeBoardId === b.id
                ? 'bg-amber-950/80 text-amber-200 border border-amber-600/70 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
              Board {b.boardNumber} · {b.totalPointsAllocated} Pts
            </div>
            <div className="font-serif text-xs sm:text-sm font-bold truncate mt-0.5">
              {b.name}
            </div>
            <div className="text-[11px] text-amber-400/90 font-mono truncate">
              Glyph: {b.socketedGlyph.name}
            </div>
          </button>
        ))}
      </div>

      {/* Active Board Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Board Data, Glyph Upgrader, Rare Nodes */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header & Theme */}
          <div className="p-5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-mono text-amber-500 font-bold">
                  Board {currentBoard.boardNumber} of 5
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-100">
                  {currentBoard.name}
                </h3>
              </div>
              <span className="text-xs font-mono text-stone-400">
                {currentBoard.totalPointsAllocated} Paragon Points
              </span>
            </div>

            <p className="text-xs text-stone-300 font-sans">
              <strong>Core Strategy:</strong> {currentBoard.pathingStrategy}
            </p>

            {currentBoard.legendaryNode && (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-600/40 text-xs">
                <div className="text-amber-400 font-serif font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Legendary Node: {currentBoard.legendaryNode.name}</span>
                </div>
                <div className="text-stone-300 leading-relaxed font-sans">
                  {currentBoard.legendaryNode.description}
                </div>
              </div>
            )}
          </div>

          {/* Glyph Level Slider & Radius Upgrades */}
          <div className="p-5 rounded-xl bg-stone-900/70 border border-purple-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-purple-950 border border-purple-500 flex items-center justify-center text-purple-300 font-bold text-xs">
                  ✦
                </div>
                <div>
                  <div className="text-xs text-stone-400 uppercase font-mono">
                    Socketed Glyph
                  </div>
                  <div className="font-serif text-lg font-bold text-purple-300">
                    {currentBoard.socketedGlyph.name} ({currentBoard.socketedGlyph.type})
                  </div>
                </div>
              </div>

              {/* Quick Level Selectors */}
              <div className="flex items-center gap-1 text-xs font-mono">
                <span className="text-stone-400 mr-1 text-[11px]">Milestones:</span>
                {[15, 21, 46, 100].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleSetGlyphLevel(currentBoard.id, lvl)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      currentGlyphLevel === lvl
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                    }`}
                  >
                    Lv.{lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-stone-400">Current Glyph Level</span>
                <span className="font-bold text-purple-400">
                  Level {currentGlyphLevel} / 100 · Radius {currentGlyphLevel >= 15 ? '4 Tiles' : '3 Tiles'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={currentGlyphLevel}
                onChange={(e) => handleSetGlyphLevel(currentBoard.id, Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Glyph Powers */}
            <div className="space-y-2 text-xs font-sans">
              <div className="p-2.5 rounded bg-stone-950/70 border border-stone-800 text-stone-300">
                <strong className="text-purple-400 font-mono">Primary Bonus: </strong>
                {currentBoard.socketedGlyph.bonusText}
              </div>
              <div className="p-2.5 rounded bg-stone-950/70 border border-stone-800 text-stone-300">
                <div className="font-mono text-emerald-400 font-semibold mb-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Secondary Bonus (Requires {currentBoard.socketedGlyph.additionalBonusReq})</span>
                </div>
                <div>{currentBoard.socketedGlyph.additionalBonusEffect}</div>
              </div>
            </div>
          </div>

          {/* Rare Nodes in this Board */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
              Prioritized Rare Nodes & Stat Thresholds
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentBoard.rareNodes.map((rn, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-stone-900/50 border border-stone-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between font-serif text-sm font-bold text-yellow-300">
                    <span>{rn.name}</span>
                    <span className="text-[10px] font-mono font-normal text-stone-400">Rare</span>
                  </div>
                  <ul className="text-xs text-stone-300 font-mono space-y-0.5">
                    {rn.stats.map((s, i) => (
                      <li key={i}>+ {s}</li>
                    ))}
                  </ul>
                  <div className="pt-1.5 border-t border-stone-800/80 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                    <span>Req: {rn.thresholdReq}</span>
                    <span className="text-stone-300">Bonus: {rn.bonus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Board Node Grid & Node Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-bold text-stone-200 uppercase tracking-wider">
                Board Pathing Matrix
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Click nodes to allocate / inspect
              </span>
            </div>

            {/* 2D Interactive Board Grid */}
            <div className="p-4 bg-stone-950 rounded-lg border border-stone-800 flex flex-col items-center">
              <div className="grid grid-cols-5 gap-2 w-full max-w-[320px]">
                {currentBoard.nodesGrid.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node);
                        handleToggleNode(node.id);
                      }}
                      title={`${node.name} (${node.type})`}
                      className={`h-11 rounded border flex flex-col items-center justify-center p-1 text-[10px] font-mono transition-transform active:scale-95 cursor-pointer ${getNodeColor(
                        node.type,
                        node.allocated
                      )} ${isSelected ? 'ring-2 ring-amber-400 scale-105' : ''}`}
                    >
                      <span className="font-bold truncate w-full text-center">
                        {node.type === 'glyph_socket'
                          ? 'GLYPH'
                          : node.type === 'legendary'
                          ? 'LEG'
                          : node.type === 'rare'
                          ? 'RARE'
                          : node.name.slice(0, 4)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grid Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-[11px] font-mono text-stone-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-purple-500 inline-block" /> Socket
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Legendary
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-yellow-500 inline-block" /> Rare
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" /> Magic
                </span>
              </div>
            </div>

            {/* Selected Node Inspector Card */}
            {selectedNode && (
              <div className="p-4 rounded-lg bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="uppercase text-amber-500 font-bold">{selectedNode.type} Node</span>
                  <span className={selectedNode.allocated ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
                    {selectedNode.allocated ? 'Allocated in Build' : 'Unallocated'}
                  </span>
                </div>
                <h4 className="font-serif text-base font-bold text-stone-100">
                  {selectedNode.name}
                </h4>
                <p className="text-xs text-stone-300 font-sans leading-relaxed">
                  {selectedNode.description}
                </p>
                {selectedNode.bonus && (
                  <div className="text-xs text-emerald-400 font-mono pt-1 border-t border-stone-800">
                    Threshold Bonus: {selectedNode.bonus}
                  </div>
                )}
              </div>
            )}

            {/* Glyph Progression Tip */}
            <div className="p-3 rounded bg-stone-950/80 border border-stone-800/80 text-[11px] text-stone-400 font-mono space-y-1">
              <div className="text-stone-200 font-semibold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Glyph Leveling Priority:</span>
              </div>
              <div>
                1. <strong>Wilds</strong> to Lv.15 (expand radius for intelligence companion damage).
              </div>
              <div>
                2. <strong>Fang and Claw</strong> to Lv.15 (werewolf close damage mitigation).
              </div>
              <div>
                3. <strong>Bane & Electrocution</strong> to Lv.21+ (push Torment IV scaling).
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
