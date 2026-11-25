import React from 'react';
import { Gamepad2 } from 'lucide-react';

interface HeaderProps {
  onLaunchGame: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLaunchGame,
  activeSection,
  setActiveSection,
}) => {
  const navItems = [
    { id: 'xbox-account', label: 'Xbox Profile' },
    { id: 'gear', label: 'Gear' },
    { id: 'skills', label: 'Skills' },
    { id: 'paragon', label: 'Paragon' },
    { id: 'meta-search', label: 'Live Search' },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-950/95 border-b border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('overview');
          }}
          className="font-serif text-lg md:text-xl font-bold tracking-wider text-amber-500 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
        >
          Diablo IV Druid Codex
        </a>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-400">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 ${
                activeSection === item.id
                  ? 'text-amber-400 border-b-2 border-amber-500 font-semibold'
                  : 'text-stone-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onLaunchGame}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Play 3D Arena</span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer strip */}
      <div className="flex md:hidden overflow-x-auto py-2 px-4 gap-4 border-t border-stone-900 bg-stone-950 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`whitespace-nowrap shrink-0 py-1 px-2 rounded ${
              activeSection === item.id
                ? 'bg-stone-800 text-amber-400 font-semibold'
                : 'text-stone-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
