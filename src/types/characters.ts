import { ParsedKanjiReading } from '../utils/romaji';

export type ItemCategory =
  | 'joyo_kanji'
  | 'jinmeiyo_kanji'
  | 'hyogai_kanji'
  | 'hiragana'
  | 'katakana'
  | 'ligature'
  | 'symbol';

export type DoubleWidthMode = 'auto' | 'off' | 'always';

export type KanaSubtag =
  | 'simple_kana'
  | 'voiced_kana'
  | 'small_kana'
  | 'historical_kana';

export interface CharacterItem {
  /** Unique identifier (e.g. char or char+id for PUA ligatures) */
  id: string;
  /** The glyph rendered in the SVG Top/Center Zone */
  char: string;
  /** Primary item category */
  category: ItemCategory;
  /** Subtag for kana filtering (simple_kana, voiced_kana, small_kana, historical_kana) */
  kanaSubtag?: KanaSubtag;
  /** Text rendered in the SVG Middle Zone */
  middleText: string;
  /** Plain string fallback for Bottom Zone (for symbols or search) */
  bottomText: string;
  /** Kana version of Bottom Zone for symbols when Bottom Zone toggle is set to Kana */
  bottomKanaText?: string;
  /** Deduplicated top 3–5 kanji readings for the SVG Bottom Zone with rootRomaji underlining */
  cardReadings?: ParsedKanjiReading[];
  /** All deduplicated On readings */
  deduplicatedOn?: ParsedKanjiReading[];
  /** All deduplicated Kun readings */
  deduplicatedKun?: ParsedKanjiReading[];
  /** All raw un-deduplicated On readings (for the click-inspector drawer) */
  allOnReadings?: ParsedKanjiReading[];
  /** All raw un-deduplicated Kun readings (for the click-inspector drawer) */
  allKunReadings?: ParsedKanjiReading[];
  /** Full English meanings array */
  meanings: string[];
  /** Stroke count (for kanji & kana/symbols) */
  strokes: number;
  /** School grade (1..6, 8 for secondary Jōyō, 9/10 for Jinmeiyō, null for Hyōgai/non-kanji) */
  grade: number | null;
  /** Newspaper frequency rank (1..2501, null if unranked) */
  frequency: number | null;
  /** JLPT level (1..5 corresponding to N1..N5, null if none) */
  jlpt?: number | null;
  /** Strict 1–19 Kanji Classification Tier ID (1..19 for kanji, undefined for kana/symbols) */
  kanjiGroup?: number;
  /** Synchronic 3-operator visual decomposition formula (for kanji) */
  visualFormula?: string;
  /** Kangxi radical number (1..214) for kanji */
  radicalNumber?: number;
  /** Kangxi radical glyph */
  radicalGlyph?: string;
  /** Kangxi radical English name */
  radicalNameEn?: string;
  /** True when this character itself is one of the 214 Kangxi Radical Base characters */
  isRadicalBase?: boolean;
  /** Which Kangxi radical (1..214) this character is the base character for */
  radicalBaseNumber?: number;
  /** Unicode code point integer */
  unicodePoint: number;
  /** Hex string e.g. U+5FC3 or U+5E7A */
  unicodeHex: string;
  /** Gojūon / catalog sort index */
  catalogOrder: number;
  /** Pre-computed lowercase search tokens (glyph, kana, custom romaji, standard romaji, English) */
  searchIndex: string;
  /** Whether historical yotsugana (ぢ/づ) was applied to any reading */
  hasYotsuganaResolution?: boolean;
  /** Raw Wiktionary {{ja-readings}} template if present */
  wiktionaryTemplate?: string;
}

export interface KangxiRadical {
  num: number;
  glyph: string;
  strokes: number;
  ja: string;
  en: string;
}

export interface TierRow {
  id: string;
  label: string;
  color: string;
  itemIds: string[];
}

export type CategoryPreset =
  | 'all'
  | 'kanji_only'
  | 'kyoiku_only'
  | 'chugaku_only'
  | 'standard_joyo'
  | 'jinmeiyo_group'
  | 'taboo_overrides'
  | 'hyogai_group'
  | 'joyo_only'
  | 'jinmeiyo_only'
  | 'radicals_only'
  | 'all_kana'
  | 'hiragana_only'
  | 'katakana_only'
  | 'simple_kana_only'
  | 'historical_kana_only'
  | 'ligatures_only'
  | 'symbols_only'
  | 'custom';

export type SortMode =
  | 'random'
  | 'strokes'
  | 'frequency'
  | 'school_order'
  | 'radical_num'
  | 'radical_name'
  | 'unicode';

export interface TabFilterState {
  preset: CategoryPreset;
  /** Combinable category toggles when user customizes beyond a preset */
  includeJoyo: boolean;
  includeJinmeiyo: boolean;
  includeHyogai: boolean;
  /** Granular 1–19 Kanji Classification Tier toggles (defaults to all 1..19 enabled) */
  enabledKanjiGroups?: number[];
  onlyRadicalBase: boolean;
  includeHiragana: boolean;
  includeKatakana: boolean;
  onlySimpleKana: boolean;
  onlyHistoricalKana: boolean;
  includeLigatures: boolean;
  includeSymbols: boolean;
  /** Yotsugana filter toggle (only show items with dji/dzu/ji/zu) */
  onlyYotsugana: boolean;
  /** Stroke count min/max */
  minStrokes: number;
  maxStrokes: number;
  /** Grade filter ('all' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | 'jinmeiyo' | 'hyogai') */
  gradeFilter: string;
  /** Radical number filter (0 = all, 1..214) */
  radicalFilter: number;
  /** Live search query */
  searchQuery: string;
}

export interface RankingTab {
  id: string;
  name: string;
  tiers: TierRow[];
  filters: TabFilterState;
  sortMode: SortMode;
  sortDesc: boolean;
  seed: string;
  /** Group Unranked Character Pool into collapsible 1–19 tier sections */
  groupByTier?: boolean;
  createdAt: number;
}
