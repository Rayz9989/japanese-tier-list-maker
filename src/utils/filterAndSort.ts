import {
  CategoryPreset,
  CharacterItem,
  SortMode,
  TabFilterState,
} from '../types/characters';
import {
  ALL_KANJI_GROUP_IDS,
  KANJI_GROUPS,
  KanjiGroupFamily,
} from '../data/kanjiClassification';
import { seededShuffle } from './prng';

const RANGE_1_TO_19 = [...ALL_KANJI_GROUP_IDS];
const RANGE_KYOIKU = [1, 2, 3, 4, 5, 6];
const RANGE_CHUGAKU = [7, 8, 9];
const RANGE_STANDARD_JOYO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RANGE_JINMEIYO = [11, 12, 13, 14];
const RANGE_TABOO_OVERRIDES = [15, 16];
const RANGE_HYOGAI = [17, 18, 19];

export function createDefaultFilterState(): TabFilterState {
  return {
    preset: 'all',
    includeJoyo: true,
    includeJinmeiyo: true,
    includeHyogai: true,
    enabledKanjiGroups: [...RANGE_1_TO_19],
    onlyRadicalBase: false,
    includeHiragana: true,
    includeKatakana: true,
    onlySimpleKana: false,
    onlyHistoricalKana: false,
    includeLigatures: true,
    includeSymbols: true,
    onlyYotsugana: false,
    minStrokes: 1,
    maxStrokes: 35,
    gradeFilter: 'all',
    radicalFilter: 0,
    searchQuery: '',
  };
}

export function applyPresetToFilterState(
  prev: TabFilterState,
  preset: CategoryPreset
): TabFilterState {
  const base: TabFilterState = {
    ...prev,
    preset,
    onlyRadicalBase: false,
    onlySimpleKana: false,
    onlyHistoricalKana: false,
    gradeFilter: 'all',
  };

  switch (preset) {
    case 'all':
      return {
        ...base,
        includeJoyo: true,
        includeJinmeiyo: true,
        includeHyogai: true,
        enabledKanjiGroups: [...RANGE_1_TO_19],
        includeHiragana: true,
        includeKatakana: true,
        includeLigatures: true,
        includeSymbols: true,
      };
    case 'kanji_only':
      return {
        ...base,
        includeJoyo: true,
        includeJinmeiyo: true,
        includeHyogai: true,
        enabledKanjiGroups: [...RANGE_1_TO_19],
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'kyoiku_only':
      return {
        ...base,
        includeJoyo: true,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [...RANGE_KYOIKU],
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'chugaku_only':
      return {
        ...base,
        includeJoyo: true,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [...RANGE_CHUGAKU],
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'standard_joyo':
    case 'joyo_only':
      return {
        ...base,
        preset: 'standard_joyo',
        includeJoyo: true,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [...RANGE_STANDARD_JOYO],
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'jinmeiyo_group':
    case 'jinmeiyo_only':
      return {
        ...base,
        preset: 'jinmeiyo_group',
        includeJoyo: false,
        includeJinmeiyo: true,
        includeHyogai: false,
        enabledKanjiGroups: [...RANGE_JINMEIYO],
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'taboo_overrides':
      return {
        ...base,
        includeJoyo: true,
        includeJinmeiyo: true,
        includeHyogai: false,
        enabledKanjiGroups: [...RANGE_TABOO_OVERRIDES],
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'hyogai_group':
      return {
        ...base,
        includeJoyo: false,
        includeJinmeiyo: false,
        includeHyogai: true,
        enabledKanjiGroups: [...RANGE_HYOGAI],
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'radicals_only':
      return {
        ...base,
        includeJoyo: true,
        includeJinmeiyo: true,
        includeHyogai: true,
        enabledKanjiGroups: [...RANGE_1_TO_19],
        onlyRadicalBase: true,
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'all_kana':
      return {
        ...base,
        includeJoyo: false,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [],
        includeHiragana: true,
        includeKatakana: true,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'hiragana_only':
      return {
        ...base,
        includeJoyo: false,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [],
        includeHiragana: true,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'katakana_only':
      return {
        ...base,
        includeJoyo: false,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [],
        includeHiragana: false,
        includeKatakana: true,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'simple_kana_only':
      return {
        ...base,
        includeJoyo: false,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [],
        includeHiragana: true,
        includeKatakana: true,
        onlySimpleKana: true,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'historical_kana_only':
      return {
        ...base,
        includeJoyo: false,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [],
        includeHiragana: true,
        includeKatakana: true,
        onlyHistoricalKana: true,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'ligatures_only':
      return {
        ...base,
        includeJoyo: false,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [],
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: true,
        includeSymbols: false,
      };
    case 'symbols_only':
      return {
        ...base,
        includeJoyo: false,
        includeJinmeiyo: false,
        includeHyogai: false,
        enabledKanjiGroups: [],
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: true,
      };
    case 'custom':
    default:
      return base;
  }
}

export function filterAndSortCharacters(
  items: readonly CharacterItem[],
  rankedIds: ReadonlySet<string>,
  unsupportedIds: ReadonlySet<string>,
  filters: TabFilterState,
  sortMode: SortMode,
  sortDesc: boolean,
  seed: string
): CharacterItem[] {
  const query = filters.searchQuery.trim().toLowerCase();
  const includeHyogai = filters.includeHyogai !== false;
  const maxStrokesLimit = Math.max(30, filters.maxStrokes || 35);
  const enabledGroupSet = filters.enabledKanjiGroups
    ? new Set<number>(filters.enabledKanjiGroups)
    : null;

  const filtered = items.filter((item) => {
    if (rankedIds.has(item.id)) return false;
    if (unsupportedIds.has(item.id)) return false;

    const isKanji =
      item.category === 'joyo_kanji' ||
      item.category === 'jinmeiyo_kanji' ||
      item.category === 'hyogai_kanji';

    if (item.category === 'joyo_kanji' && !filters.includeJoyo) return false;
    if (item.category === 'jinmeiyo_kanji' && !filters.includeJinmeiyo) return false;
    if (item.category === 'hyogai_kanji' && !includeHyogai) return false;
    if (item.category === 'hiragana' && !filters.includeHiragana) return false;
    if (item.category === 'katakana' && !filters.includeKatakana) return false;
    if (item.category === 'ligature' && !filters.includeLigatures) return false;
    if (item.category === 'symbol' && !filters.includeSymbols) return false;

    if (isKanji && enabledGroupSet) {
      const grp = item.kanjiGroup ?? 19;
      if (!enabledGroupSet.has(grp)) return false;
    }

    if (filters.onlyRadicalBase && !item.isRadicalBase) return false;

    if (item.category === 'hiragana' || item.category === 'katakana') {
      if (filters.onlySimpleKana && item.kanaSubtag !== 'simple_kana') return false;
      if (filters.onlyHistoricalKana && item.kanaSubtag !== 'historical_kana') return false;
    }

    if (filters.onlyYotsugana && !item.hasYotsuganaResolution) return false;

    if (
      item.strokes < filters.minStrokes ||
      (filters.maxStrokes < 30 ? item.strokes > filters.maxStrokes : item.strokes > maxStrokesLimit)
    ) {
      return false;
    }

    if (filters.gradeFilter !== 'all') {
      if (filters.gradeFilter === 'jinmeiyo') {
        if (item.category !== 'jinmeiyo_kanji') return false;
      } else if (filters.gradeFilter === 'hyogai') {
        if (item.category !== 'hyogai_kanji') return false;
      } else if (filters.gradeFilter.startsWith('group_')) {
        const targetGroup = parseInt(filters.gradeFilter.slice(6), 10);
        if (item.kanjiGroup !== targetGroup) return false;
      } else {
        const g = parseInt(filters.gradeFilter, 10);
        if (item.grade !== g) return false;
      }
    }

    if (filters.radicalFilter > 0) {
      if (item.radicalNumber !== filters.radicalFilter) return false;
    }

    if (query) {
      if (!item.searchIndex.includes(query)) return false;
    }

    return true;
  });

  if (sortMode === 'random') {
    return seededShuffle(filtered, seed, sortDesc);
  }

  const dir = sortDesc ? -1 : 1;
  const sorted = [...filtered];

  sorted.sort((a, b) => {
    switch (sortMode) {
      case 'strokes': {
        if (a.strokes !== b.strokes) return (a.strokes - b.strokes) * dir;
        return (a.catalogOrder - b.catalogOrder) * dir;
      }
      case 'frequency': {
        const fa = a.frequency ?? 999999;
        const fb = b.frequency ?? 999999;
        if (fa !== fb) {
          if (fa === 999999) return 1;
          if (fb === 999999) return -1;
          return (fa - fb) * dir;
        }
        return a.catalogOrder - b.catalogOrder;
      }
      case 'school_order': {
        const rankSchool = (x: CharacterItem): number => {
          if (x.kanjiGroup && x.kanjiGroup >= 1 && x.kanjiGroup <= 19) {
            return x.kanjiGroup;
          }
          if (x.category === 'hiragana') return 20;
          if (x.category === 'katakana') return 21;
          if (x.category === 'ligature') return 22;
          return 23;
        };
        const ra = rankSchool(a);
        const rb = rankSchool(b);
        if (ra !== rb) return (ra - rb) * dir;
        if (a.strokes !== b.strokes) return (a.strokes - b.strokes) * dir;
        return (a.catalogOrder - b.catalogOrder) * dir;
      }
      case 'radical_num': {
        const ra = a.radicalNumber ?? 999;
        const rb = b.radicalNumber ?? 999;
        if (ra !== rb) {
          if (ra === 999) return 1;
          if (rb === 999) return -1;
          return (ra - rb) * dir;
        }
        return (a.strokes - b.strokes) * dir;
      }
      case 'radical_name': {
        const na = a.radicalNameEn ?? 'zzz';
        const nb = b.radicalNameEn ?? 'zzz';
        if (na !== nb) {
          if (na === 'zzz') return 1;
          if (nb === 'zzz') return -1;
          return na.localeCompare(nb) * dir;
        }
        return (a.strokes - b.strokes) * dir;
      }
      case 'unicode':
      default: {
        if (a.category !== b.category) {
          return (a.catalogOrder - b.catalogOrder) * dir;
        }
        if (a.category === 'hiragana' || a.category === 'katakana') {
          return (a.catalogOrder - b.catalogOrder) * dir;
        }
        return (a.unicodePoint - b.unicodePoint) * dir;
      }
    }
  });

  return sorted;
}

export interface PoolTierSection {
  key: string;
  orderIndex: number;
  title: string;
  subtitle: string;
  family?: KanjiGroupFamily | 'kana' | 'symbol';
  accentTextClass: string;
  accentBorderClass: string;
  items: CharacterItem[];
}

/**
 * Collates an already-sorted pool array into strict 1 -> 19 Kanji Classification Tier sections
 * (followed by Hiragana, Katakana, Kana Ligatures, and Japanese Symbols when enabled),
 * preserving the active intra-group sort order (including seeded Random).
 */
export function partitionPoolByClassificationTier(
  sortedItems: readonly CharacterItem[]
): PoolTierSection[] {
  const kanjiBuckets = new Map<number, CharacterItem[]>();
  const hiraganaItems: CharacterItem[] = [];
  const katakanaItems: CharacterItem[] = [];
  const ligatureItems: CharacterItem[] = [];
  const symbolItems: CharacterItem[] = [];

  for (const item of sortedItems) {
    if (
      item.category === 'joyo_kanji' ||
      item.category === 'jinmeiyo_kanji' ||
      item.category === 'hyogai_kanji'
    ) {
      const grp = item.kanjiGroup ?? 19;
      let arr = kanjiBuckets.get(grp);
      if (!arr) {
        arr = [];
        kanjiBuckets.set(grp, arr);
      }
      arr.push(item);
    } else if (item.category === 'hiragana') {
      hiraganaItems.push(item);
    } else if (item.category === 'katakana') {
      katakanaItems.push(item);
    } else if (item.category === 'ligature') {
      ligatureItems.push(item);
    } else {
      symbolItems.push(item);
    }
  }

  const sections: PoolTierSection[] = [];

  for (const meta of KANJI_GROUPS) {
    const bucket = kanjiBuckets.get(meta.id);
    if (bucket && bucket.length > 0) {
      sections.push({
        key: `kanji_group_${meta.id}`,
        orderIndex: meta.id,
        title: `${meta.id}. ${meta.name}`,
        subtitle: meta.description,
        family: meta.family,
        accentTextClass: meta.accentTextClass,
        accentBorderClass: meta.accentBorderClass,
        items: bucket,
      });
    }
  }

  if (hiraganaItems.length > 0) {
    sections.push({
      key: 'script_hiragana',
      orderIndex: 20,
      title: 'Hiragana Syllabary',
      subtitle: 'Modern, voiced, small, and archaic Hiragana',
      family: 'kana',
      accentTextClass: 'text-teal-300',
      accentBorderClass: 'border-teal-500/40',
      items: hiraganaItems,
    });
  }

  if (katakanaItems.length > 0) {
    sections.push({
      key: 'script_katakana',
      orderIndex: 21,
      title: 'Katakana Syllabary',
      subtitle: 'Modern, voiced, Ainu small, and archaic Katakana',
      family: 'kana',
      accentTextClass: 'text-teal-300',
      accentBorderClass: 'border-teal-500/40',
      items: katakanaItems,
    });
  }

  if (ligatureItems.length > 0) {
    sections.push({
      key: 'script_ligatures',
      orderIndex: 22,
      title: 'Kana Ligatures (Gōryakugana)',
      subtitle: 'Polysyllabic Hiragana & Katakana digraphs',
      family: 'kana',
      accentTextClass: 'text-cyan-300',
      accentBorderClass: 'border-cyan-500/40',
      items: ligatureItems,
    });
  }

  if (symbolItems.length > 0) {
    sections.push({
      key: 'script_symbols',
      orderIndex: 23,
      title: 'Native Japanese Symbols & Marks',
      subtitle: 'Iteration marks, brackets, and native punctuation',
      family: 'symbol',
      accentTextClass: 'text-zinc-300',
      accentBorderClass: 'border-zinc-700',
      items: symbolItems,
    });
  }

  return sections;
}
