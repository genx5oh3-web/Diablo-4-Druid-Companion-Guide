import React, { useState } from 'react';
import { Search, ExternalLink, Loader2, Globe, AlertCircle, Sparkles } from 'lucide-react';
import { BuildVariant } from '../types/druid';

interface SearchSource {
  title: string;
  uri: string;
}

interface MetaSearchSectionProps {
  variant: BuildVariant;
}

const PRESET_QUERIES = [
  'Latest Diablo 4 Druid Companion & Wolves patch notes and buffs',
  'Best Diablo 4 Storm’s Companion tempering & masterworking stat priorities',
  'Where to farm Storm’s Companion and Harlequin Crest in current Diablo 4 season',
  'Shepherd’s Aspect vs Stampede Aspect companion scaling mechanics',
];

export const MetaSearchSection: React.FC<MetaSearchSectionProps> = ({ variant }) => {
  const [query, setQuery] = useState<string>(PRESET_QUERIES[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setQuery(trimmed);

    try {
      const res = await fetch('/api/search-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, variant }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to query live Google Search data.');
      }
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected search error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="meta-search" className="space-y-6">
      <div className="pb-4 border-b border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-wide">
              Live Meta & Patch Search
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Query real-time Diablo IV patch notes, season hotfixes, and community theorycrafting grounded with Google Search.
            </p>
          </div>
          <span className="text-xs font-mono text-sky-400 flex items-center gap-1.5 self-start sm:self-auto">
            <Globe className="w-3.5 h-3.5" />
            <span>Live Search Grounded</span>
          </span>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-4">
        {/* Search Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about current Diablo 4 Druid Companion patch changes, Pit clears, or drops..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-none text-sm text-stone-100 placeholder:text-stone-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Meta</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Preset Queries */}
        <div className="flex flex-wrap gap-2">
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleSearch(preset)}
              disabled={loading}
              className="px-3 py-1.5 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs text-stone-300 hover:text-amber-300 transition-colors cursor-pointer text-left"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Grounded Response Display */}
        {answer && (
          <div className="p-5 rounded-lg bg-stone-950 border border-stone-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-amber-400 border-b border-stone-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Sanctuary Intelligence</span>
              </span>
              <span className="text-stone-500">{sources.length} Sources Cited</span>
            </div>

            <div className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap font-sans">
              {answer}
            </div>

            {sources.length > 0 && (
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold font-mono">
                  Google Search Grounding Sources
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded bg-stone-900/70 hover:bg-stone-800 border border-stone-800 text-xs text-sky-300 hover:text-sky-200 flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="truncate">{src.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
