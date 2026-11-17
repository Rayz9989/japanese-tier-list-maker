import React, { useState } from 'react';
import {
  Search,
  Dices,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  X,
  Layers,
  ListTree,
} from 'lucide-react';
import {
  CategoryPreset,
  KangxiRadical,
  SortMode,
  TabFilterState,
} from '../types/characters';
import {
  ALL_KANJI_GROUP_IDS,
  KANJI_GROUPS,
} from '../data/kanjiClassification';
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
  groupByTier: boolean;
  onToggleGroupByTier: () => void;
  radicals: KangxiRadical[];
  filteredCount: number;
  totalPoolCount: number;
}

const PRESETS: ReadonlyArray<{ id: CategoryPreset; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'kanji_only', label: 'All Kanji' },
  { id: 'kyoiku_only', label: 'Kyōiku [1–6]' },
  { id: 'chugaku_only', label: 'Chūgaku [7–9]' },
  { id: 'standard_joyo', label: 'Standard Jōyō [1–10]' },
  { id: 'jinmeiyo_group', label: 'Jinmeiyō [11–14]' },
  { id: 'taboo_overrides', label: 'Taboo Overrides [15–16]' },
  { id: 'hyogai_group', label: 'Hyōgai [17–19]' },
  { id: 'radicals_only', label: 'Kangxi Radicals [214]' },
  { id: 'all_kana', label: 'All Kana' },
  { id: 'hiragana_only', label: 'Hiragana' },
  { id: 'katakana_only', label: 'Katakana' },
  { id: 'simple_kana_only', label: 'Simple Syllables' },
  { id: 'historical_kana_only', label: 'Historical / Archaic Kana' },
  { id: 'ligatures_only', label: 'Kana Ligatures' },
  { id: 'symbols_only', label: 'Japanese Symbols' },
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
  groupByTier,
  onToggleGroupByTier,
  radicals,
  filteredCount,
  totalPoolCount,
}) => {
  const [showTierMatrix, setShowTierMatrix] = useState(false);
  const [showCombinableToggles, setShowCombinableToggles] = useState(false);

  const enabledGroups = filters.enabledKanjiGroups ?? [...ALL_KANJI_GROUP_IDS];
  const enabledGroupSet = new Set<number>(enabledGroups);

  const handlePresetClick = (preset: CategoryPreset) => {
    onChangeFilters(applyPresetToFilterState(filters, preset));
  };

  const handleResetFilters = () => {
    onChangeFilters(createDefaultFilterState());
  };

  const syncCategoriesForGroups = (nextGroups: number[], prev: TabFilterState): TabFilterState => {
    const s = new Set(nextGroups);
    const hasJoyoTier = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16].some((g) => s.has(g));
    const hasJinmeiyoTier = [11, 12, 13, 14, 15, 16].some((g) => s.has(g));
    const hasHyogaiTier = [17, 18, 19].some((g) => s.has(g));
    return {
      ...prev,
      preset: 'custom',
      enabledKanjiGroups: nextGroups,
      includeJoyo: hasJoyoTier,
      includeJinmeiyo: hasJinmeiyoTier,
      includeHyogai: hasHyogaiTier,
    };
  };

  const handleToggleSingleKanjiGroup = (groupId: number) => {
    const next = enabledGroupSet.has(groupId)
      ? enabledGroups.filter((g) => g !== groupId)
      : [...enabledGroups, groupId].sort((a, b) => a - b);
    onChangeFilters(syncCategoriesForGroups(next, filters));
  };

  const handleSetKanjiGroupSelection = (nextGroups: number[]) => {
    onChangeFilters(syncCategoriesForGroups(nextGroups, filters));
  };

  return (
    <section
      aria-label="Character Pool Filters and Sorting"
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3.5"
      style={{ fontFamily: "'Andika', sans-serif" }}
    >
      {/* Row 1: Category Filter Macro Presets + 19-Tier Matrix & Combinable Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Category Filter Presets"
          className="flex flex-wrap items-center gap-1.5"
        >
          {PRESETS.map((p) => {
            const active =
              filters.preset === p.id ||
              (p.id === 'standard_joyo' && filters.preset === 'joyo_only') ||
              (p.id === 'jinmeiyo_group' && filters.preset === 'jinmeiyo_only');
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
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
            onClick={() => setShowTierMatrix((v) => !v)}
            aria-expanded={showTierMatrix}
            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 tabular-nums ${
              showTierMatrix || enabledGroups.length < 19
                ? 'bg-zinc-800 text-amber-300 border-amber-500/40'
                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>19 Kanji Tiers ({enabledGroups.length}/19)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCombinableToggles((v) => !v)}
            aria-expanded={showCombinableToggles}
            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              showCombinableToggles || filters.onlyYotsugana || filters.onlyRadicalBase
                ? 'bg-zinc-800 text-amber-300 border-amber-500/40'
                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Script Toggles</span>
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

      {/* Granular 1–19 Kanji Classification Tier Matrix */}
      {showTierMatrix && (
        <div
          role="group"
          aria-label="Individual 1–19 Kanji Tier Toggles"
          className="pt-3 pb-1 border-t border-zinc-800/80 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-zinc-200">
              Toggle Individual Kanji Classification Tiers (1–19)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetKanjiGroupSelection([...ALL_KANJI_GROUP_IDS])}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold whitespace-nowrap"
              >
                Select All 1–19
              </button>
              <button
                type="button"
                onClick={() => handleSetKanjiGroupSelection([])}
                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 whitespace-nowrap"
              >
                Clear All Tiers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
            {KANJI_GROUPS.map((grp) => {
              const checked = enabledGroupSet.has(grp.id);
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => handleToggleSingleKanjiGroup(grp.id)}
                  aria-pressed={checked}
                  title={grp.description}
                  className={`px-2.5 py-1.5 rounded-md border text-left text-xs transition-colors flex items-center justify-between gap-1.5 whitespace-nowrap overflow-hidden ${
                    checked
                      ? `${grp.accentSurfaceClass} ${grp.accentBorderClass} text-zinc-100 font-bold`
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="truncate tabular-nums">
                    <span className={checked ? grp.accentTextClass : 'text-zinc-500'}>
                      {grp.id}.
                    </span>{' '}
                    {grp.shortName}
                  </span>
                  <span className="text-[10px] shrink-0">
                    {checked ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional Combinable Script Checkboxes Row */}
      {showCombinableToggles && (
        <div className="pt-2 pb-1 border-t border-zinc-800/80 flex flex-wrap items-center gap-4 text-xs text-zinc-300">
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeJoyo}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  preset: 'custom',
                  includeJoyo: e.target.checked,
                })
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
                onChangeFilters({
                  ...filters,
                  preset: 'custom',
                  includeJinmeiyo: e.target.checked,
                })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Jinmeiyō Kanji</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeHyogai !== false}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  preset: 'custom',
                  includeHyogai: e.target.checked,
                })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>Hyōgai Kanji (Pre-1 / JIS-1 / Radicals)</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-amber-300 font-bold">
            <input
              type="checkbox"
              checked={Boolean(filters.onlyRadicalBase)}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  preset: 'custom',
                  onlyRadicalBase: e.target.checked,
                })
              }
              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <span>214 Kangxi Radical Base Only</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.includeHiragana}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  preset: 'custom',
                  includeHiragana: e.target.checked,
                })
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
                onChangeFilters({
                  ...filters,
                  preset: 'custom',
                  includeKatakana: e.target.checked,
                })
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
                  preset: 'custom',
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
                  preset: 'custom',
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
                onChangeFilters({
                  ...filters,
                  preset: 'custom',
                  includeLigatures: e.target.checked,
                })
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
                onChangeFilters({
                  ...filters,
                  preset: 'custom',
                  includeSymbols: e.target.checked,
                })
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

      {/* Row 2A: Live Search + Sort Mode + Group by Tier + Seeded PRNG */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              onChangeFilters({ ...filters, searchQuery: e.target.value })
            }
            aria-label="Search characters by glyph, kana, custom romaji, or English"
            placeholder="Search glyph, kana, djuu/dji/dzu, formula, or English..."
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

        <div className="flex flex-wrap items-center gap-2">
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
            <option value="school_order">School / Learning Order (1→19)</option>
            <option value="strokes">Stroke Count</option>
            <option value="frequency">Frequency Rank</option>
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

          {/* Group by Tier (1–19) Collation Toggle */}
          <button
            type="button"
            onClick={onToggleGroupByTier}
            aria-pressed={groupByTier}
            title="Partition the Unranked Character Pool into collapsible 1–19 classification tier sections while sorting cards inside each section"
            className={`px-2.5 py-1.5 rounded-md border text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              groupByTier
                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Group by Tier</span>
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
      </div>

      {/* Row 2B: Stroke Range + Classification Tier Quick Select + Kangxi Radical Select + Live Count */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-800/70 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1">
            <span className="text-zinc-400">Strokes:</span>
            <input
              type="number"
              min={1}
              max={35}
              value={filters.minStrokes}
              aria-label="Minimum strokes"
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  minStrokes: Math.max(1, Math.min(35, Number(e.target.value) || 1)),
                })
              }
              className="w-8 bg-transparent text-center text-zinc-100 tabular-nums focus:outline-none"
            />
            <span className="text-zinc-500">–</span>
            <input
              type="number"
              min={1}
              max={35}
              value={filters.maxStrokes}
              aria-label="Maximum strokes"
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  maxStrokes: Math.max(1, Math.min(35, Number(e.target.value) || 35)),
                })
              }
              className="w-8 bg-transparent text-center text-zinc-100 tabular-nums focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by Classification Tier or Grade"
            value={filters.gradeFilter}
            onChange={(e) =>
              onChangeFilters({ ...filters, gradeFilter: e.target.value })
            }
            className="py-1.5 px-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All 19 Tiers &amp; Grades</option>
            {KANJI_GROUPS.map((g) => (
              <option key={g.id} value={`group_${g.id}`}>
                {g.id}. {g.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Kangxi Radical"
            value={filters.radicalFilter}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                radicalFilter: Number(e.target.value) || 0,
              })
            }
            className="py-1.5 px-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value={0}>All 214 Kangxi Radicals</option>
            {radicals.map((rad) => (
              <option key={rad.num} value={rad.num}>
                #{rad.num} {rad.glyph} ({rad.en})
              </option>
            ))}
          </select>
        </div>

        <span className="text-zinc-400 tabular-nums whitespace-nowrap">
          Showing <strong className="text-zinc-100">{filteredCount.toLocaleString()}</strong> of{' '}
          {totalPoolCount.toLocaleString()} unranked items
        </span>
      </div>
    </section>
  );
};
