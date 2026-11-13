import {
  CategoryPreset,
  CharacterItem,
  SortMode,
  TabFilterState,
} from '../types/characters';
import { seededShuffle } from './prng';

export function createDefaultFilterState(): TabFilterState {
  return {
    preset: 'all',
    includeJoyo: true,
    includeJinmeiyo: true,
    includeHiragana: true,
    includeKatakana: true,
    onlySimpleKana: false,
    onlyHistoricalKana: false,
    includeLigatures: true,
    includeSymbols: true,
    onlyYotsugana: false,
    minStrokes: 1,
    maxStrokes: 30,
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
    onlySimpleKana: false,
    onlyHistoricalKana: false,
  };

  switch (preset) {
    case 'all':
      return {
        ...base,
        includeJoyo: true,
        includeJinmeiyo: true,
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
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'joyo_only':
      return {
        ...base,
        includeJoyo: true,
        includeJinmeiyo: false,
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: false,
      };
    case 'jinmeiyo_only':
      return {
        ...base,
        includeJoyo: false,
        includeJinmeiyo: true,
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
        includeHiragana: false,
        includeKatakana: false,
        includeLigatures: false,
        includeSymbols: true,
      };
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

  const filtered = items.filter((item) => {
    // Exclude already-ranked items in this tab
    if (rankedIds.has(item.id)) return false;
    // Exclude unsupported tofu glyphs detected by canvas check
    if (unsupportedIds.has(item.id)) return false;

    // Category checks
    if (item.category === 'joyo_kanji' && !filters.includeJoyo) return false;
    if (item.category === 'jinmeiyo_kanji' && !filters.includeJinmeiyo) return false;
    if (item.category === 'hiragana' && !filters.includeHiragana) return false;
    if (item.category === 'katakana' && !filters.includeKatakana) return false;
    if (item.category === 'ligature' && !filters.includeLigatures) return false;
    if (item.category === 'symbol' && !filters.includeSymbols) return false;

    if (item.category === 'hiragana' || item.category === 'katakana') {
      if (filters.onlySimpleKana && item.kanaSubtag !== 'simple_kana') return false;
      if (filters.onlyHistoricalKana && item.kanaSubtag !== 'historical_kana') return false;
    }

    if (filters.onlyYotsugana && !item.hasYotsuganaResolution) return false;

    // Stroke count range
    if (item.strokes < filters.minStrokes || item.strokes > filters.maxStrokes) return false;

    // Grade filter (applies when set to a specific grade)
    if (filters.gradeFilter !== 'all') {
      if (filters.gradeFilter === 'jinmeiyo') {
        if (item.category !== 'jinmeiyo_kanji') return false;
      } else {
        const g = parseInt(filters.gradeFilter, 10);
        if (item.grade !== g) return false;
      }
    }

    // Radical filter
    if (filters.radicalFilter > 0) {
      if (item.radicalNumber !== filters.radicalFilter) return false;
    }

    // Live search query
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
          // Always keep unranked items at the bottom regardless of asc/desc
          if (fa === 999999) return 1;
          if (fb === 999999) return -1;
          return (fa - fb) * dir;
        }
        return a.catalogOrder - b.catalogOrder;
      }
      case 'school_order': {
        const rankSchool = (x: CharacterItem): number => {
          if (x.category === 'joyo_kanji') {
            return x.grade && x.grade <= 6 ? x.grade : 7;
          }
          if (x.category === 'jinmeiyo_kanji') return 8;
          if (x.category === 'hiragana') return 9;
          if (x.category === 'katakana') return 10;
          if (x.category === 'ligature') return 11;
          return 12;
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
        // Group kana in Gojūon catalogOrder, kanji in Unicode order
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
