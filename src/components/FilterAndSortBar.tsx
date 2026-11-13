import React, { useState } from 'react';
import {
  Search,
  Dices,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  CategoryPreset,
  KangxiRadical,
  SortMode,
  TabFilterState,
} from '../types/characters';
import {
  applyPresetToFilterState,
  createDefaultFilterState,
} from '../utils/filterAndSort';

export interface FilterAndSortBarProps {
  filters: TabFilterState;
  onChangeFilters: (next: TabFilterState) => void;
  sortMode: SortMode;
  onChangeSortMode: (mode: SortMode) => void;
  sortDesc: boolean;
  onToggleSortDesc: () => void;
  seed: string;
  onChangeSeed: (seed: string) => void;
  onNewRandomSeed: () => void;
  radicals: KangxiRadical[];
  filteredCount: number;
  totalPoolCount: number;
}

const PRESETS: ReadonlyArray<{ id: CategoryPreset; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'kanji_only', label: 'Kanji Only' },
  { id: 'joyo_only', label: 'Jōyō Only' },
  { id: 'jinmeiyo_only', label: 'Jinmeiyō Only' },
  { id: 'all_kana', label: 'All Kana' },
  { id: 'hiragana_only', label: 'Hiragana Only' },
  { id: 'katakana_only', label: 'Katakana Only' },
  { id: 'simple_kana_only', label: 'Simple Syllables Only' },
  { id: 'historical_kana_only', label: 'Historical / Archaic Kana' },
  { id: 'ligatures_only', label: 'Kana Ligatures' },
  { id: 'symbols_only', label: 'Japanese Symbols Only' },
];

export const FilterAndSortBar: React.FC<FilterAndSortBarProps> = ({
  filters,
  onChangeFilters,
  sortMode,
  onChangeSortMode,
  sortDesc,
  onToggleSortDesc,
  seed,
  onChangeSeed,
  onNewRandomSeed,
  radicals,
  filteredCount,
  totalPoolCount,
}) => {
  const [showCombinableToggles, setShowCombinableToggles] = useState(false);

  const handlePresetClick = (preset: CategoryPreset) => {
    onChangeFilters(applyPresetToFilterState(filters, preset));
  };

  const handleResetFilters = () => {
    onChangeFilters(createDefaultFilterState());
  };

  return (
    <section
      aria-label="Character Pool Filters and Sorting"
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3.5"
      style={{ fontFamily: "'Andika', sans-serif" }}
    >
      {/* Row 1: Category Filter Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Category Filter Presets"
          className="flex flex-wrap items-center gap-1.5"
        >
          {PRESETS.map((p) => {
            const active = filters.preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 border border-zinc-800'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCombinableToggles((v) => !v)}
            aria-expanded={showCombinableToggles}
            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              showCombinableToggles || filters.onlyYotsugana
                ? 'bg-zinc-800 text-amber-300 border-amber-500/40'
                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Combinable Toggles</span>
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            title="Reset all filters"
            className="px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Optional Combinable Category Checkboxes Row */}
      {showCombinableToggles && (
        <div className="pt-2 pb-1 border-t border-zinc-800/80 flex flex-wrap items-center gap-4 text-xs text-zinc-300">
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeJoyo}
              onChange={(e) =>
                onChangeFilters({ ...filters, includeJoyo: e.target.checked })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Jōyō Kanji</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeJinmeiyo}
              onChange={(e) =>
                onChangeFilters({ ...filters, includeJinmeiyo: e.target.checked })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Jinmeiyō Kanji</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeHiragana}
              onChange={(e) =>
                onChangeFilters({ ...filters, includeHiragana: e.target.checked })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Hiragana</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeKatakana}
              onChange={(e) =>
                onChangeFilters({ ...filters, includeKatakana: e.target.checked })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Katakana</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.onlySimpleKana}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  onlySimpleKana: e.target.checked,
                  onlyHistoricalKana: e.target.checked ? false : filters.onlyHistoricalKana,
                })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Simple Kana Only</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.onlyHistoricalKana}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  onlyHistoricalKana: e.target.checked,
                  onlySimpleKana: e.target.checked ? false : filters.onlySimpleKana,
                })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Historical / Archaic Kana Only</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeLigatures}
              onChange={(e) =>
                onChangeFilters({ ...filters, includeLigatures: e.target.checked })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Kana Ligatures</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeSymbols}
              onChange={(e) =>
                onChangeFilters({ ...filters, includeSymbols: e.target.checked })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Native Symbols</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-amber-300 font-bold">
            <input
              type="checkbox"
              checked={filters.onlyYotsugana}
              onChange={(e) =>
                onChangeFilters({ ...filters, onlyYotsugana: e.target.checked })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Historical ぢ/づ (dji/dzu) Only</span>
          </label>
        </div>
      )}

      {/* Row 2: Live Search + Sort Mode + Seeded PRNG + Granular Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center pt-1">
        {/* Search Input (4 cols) */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              onChangeFilters({ ...filters, searchQuery: e.target.value })
            }
            aria-label="Search characters by glyph, kana, custom romaji, or English"
            placeholder="Search glyph, kana, djuu/dji/dzu/tchi/shhi, or English..."
            className="w-full pl-9 pr-8 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onChangeFilters({ ...filters, searchQuery: '' })}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Mode + Asc/Desc + Seed Input (4 cols) */}
        <div className="lg:col-span-4 flex flex-wrap items-center gap-2">
          <label className="text-xs text-zinc-400 shrink-0" htmlFor="sort-mode-select">
            Sort:
          </label>
          <select
            id="sort-mode-select"
            value={sortMode}
            onChange={(e) => onChangeSortMode(e.target.value as SortMode)}
            className="py-1.5 px-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          >
            <option value="random">Random (Seeded PRNG)</option>
            <option value="strokes">Stroke Count</option>
            <option value="frequency">Frequency Rank</option>
            <option value="school_order">School / Learning Order</option>
            <option value="radical_num">Radical (Kangxi #1–214)</option>
            <option value="radical_name">Radical (English Name A–Z)</option>
            <option value="unicode">Unicode / Gojūon Order</option>
          </select>

          <button
            type="button"
            onClick={onToggleSortDesc}
            aria-label={`Sort direction: ${sortDesc ? 'Descending' : 'Ascending'}`}
            className="px-2.5 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-200 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortDesc ? 'Desc' : 'Asc'}</span>
          </button>

          {/* Seed Input + New Seed Button */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={seed}
              onChange={(e) => onChangeSeed(e.target.value)}
              aria-label="Random seed"
              placeholder="Seed..."
              className="w-28 py-1.5 px-2 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 tabular-nums focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={onNewRandomSeed}
              aria-label="New Seed"
              className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>New Seed</span>
            </button>
          </div>
        </div>

        {/* Stroke Range + Grade + Radical + Count (4 cols) */}
        <div className="lg:col-span-4 flex flex-wrap items-center justify-end gap-2 text-xs">
          {/* Stroke Range */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1">
            <span className="text-zinc-400">Strokes:</span>
            <input
              type="number"
              min={1}
              max={30}
              value={filters.minStrokes}
              aria-label="Minimum strokes"
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  minStrokes: Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                })
              }
              className="w-9 bg-transparent text-center text-zinc-100 tabular-nums focus:outline-none"
            />
            <span className="text-zinc-500">–</span>
            <input
              type="number"
              min={1}
              max={30}
              value={filters.maxStrokes}
              aria-label="Maximum strokes"
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  maxStrokes: Math.max(1, Math.min(30, Number(e.target.value) || 30)),
                })
              }
              className="w-9 bg-transparent text-center text-zinc-100 tabular-nums focus:outline-none"
            />
          </div>

          {/* School Grade Filter */}
          <select
            aria-label="Filter by School Grade"
            value={filters.gradeFilter}
            onChange={(e) =>
              onChangeFilters({ ...filters, gradeFilter: e.target.value })
            }
            className="py-1.5 px-2 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Grades</option>
            <option value="1">Grade 1 (80)</option>
            <option value="2">Grade 2 (160)</option>
            <option value="3">Grade 3 (200)</option>
            <option value="4">Grade 4 (202)</option>
            <option value="5">Grade 5 (193)</option>
            <option value="6">Grade 6 (191)</option>
            <option value="8">Secondary Jōyō</option>
            <option value="jinmeiyo">Jinmeiyō</option>
          </select>

          {/* Kangxi Radical Filter */}
          <select
            aria-label="Filter by Kangxi Radical"
            value={filters.radicalFilter}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                radicalFilter: Number(e.target.value) || 0,
              })
            }
            className="max-w-[140px] py-1.5 px-2 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value={0}>All 214 Radicals</option>
            {radicals.map((rad) => (
              <option key={rad.num} value={rad.num}>
                #{rad.num} {rad.glyph} ({rad.en})
              </option>
            ))}
          </select>

          <span className="text-zinc-400 tabular-nums whitespace-nowrap pl-1">
            <strong className="text-zinc-100">{filteredCount.toLocaleString()}</strong> /{' '}
            {totalPoolCount.toLocaleString()} items
          </span>
        </div>
      </div>
    </section>
  );
};
