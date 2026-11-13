/**
 * Custom 4-Way Yotsugana + Modified JSL Romanization Engine
 * and Wiktionary-Style Kanji Root Underlining & Stem Deduplication.
 */

export interface ParsedKanjiReading {
  /** Original raw reading from dataset, e.g., "おも.い" or "ジュウ" */
  raw: string;
  /** Reading after historical yotsugana (ぢ/づ) grafting, e.g., "ぢゅう" or "はぢ.る" */
  resolvedKana: string;
  /** Kana of the kanji root (before '.'), e.g., "おも", "みっ", "ぢゅう" */
  rootKana: string;
  /** Kana of trailing okurigana (after '.'), e.g., "い", "つ", "" */
  okuriganaKana: string;
  /** Custom romanized root (underlined when okurigana is present), e.g., "omo", "mit", "djuu" */
  rootRomaji: string;
  /** Custom romanized okurigana (plain text), e.g., "i", "tsu", "" */
  okuriganaRomaji: string;
  /** Combined lowercase custom romaji with no dots/spaces, e.g., "omoi", "mittsu", "djuu" */
  fullRomaji: string;
  /** Combined kana with no dots/hyphens, e.g., "おもい", "みっつ", "ぢゅう" */
  fullKana: string;
  /** True if okurigana follows the kanji root */
  hasOkurigana: boolean;
  /** Reading category */
  type: 'on' | 'kun';
}

const DIGRAPH_MAP: Record<string, string> = {
  // Palatalized yōon (strict Nihon-shiki base before Step B)
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'しゃ': 'sya', 'しゅ': 'syu', 'しょ': 'syo',
  'じゃ': 'zya', 'じゅ': 'zyu', 'じょ': 'zyo',
  'ちゃ': 'tya', 'ちゅ': 'tyu', 'ちょ': 'tyo',
  'ぢゃ': 'dya', 'ぢゅ': 'dyu', 'ぢょ': 'dyo',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  // Extended foreign/loan combinations
  'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo',
  'ゔぁ': 'va', 'ゔぃ': 'vi', 'ゔぇ': 've', 'ゔぉ': 'vo',
  'うぃ': 'wi', 'うぇ': 'we', 'うぉ': 'wo',
};

const MONOGRAPH_MAP: Record<string, string> = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'ゕ': 'ka', 'ゖ': 'ke', 'ヵ': 'ka', 'ヶ': 'ke',
  'さ': 'sa', 'し': 'si', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'ti', 'つ': 'tu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'hu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ゎ': 'wa',
  'ゔ': 'vu',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'zi', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'di', 'づ': 'du', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  // Special katakana
  'ヷ': 'va', 'ヸ': 'vi', 'ヹ': 've', 'ヺ': 'vo',
  // Phonetic extensions (Ainu/small katakana)
  'ㇰ': 'ku', 'ㇱ': 'si', 'ㇲ': 'su', 'ㇳ': 'to',
  'ㇴ': 'nu', 'ㇵ': 'ha', 'ㇶ': 'hi', 'ㇷ': 'hu',
  'ㇸ': 'he', 'ㇹ': 'ho', 'ㇺ': 'mu', 'ㇻ': 'ra',
  'ㇼ': 'ri', 'ㇽ': 'ru', 'ㇾ': 're', 'ㇿ': 'ro',
  // Archaic Plane 1 Kana
  '𛀆': 'yi', '𛄠': 'yi',
  '𛀁': 'ye', '𛄡': 'ye',
  '𛄟': 'wu', '𛄢': 'wu',
  // Kana Ligatures
  'ゟ': 'yori', 'ヿ': 'koto', '𪜈': 'tomo', '𬼀': 'shite', '𬻿': 'nari', '𬼂': 'nari',
};

/**
 * Convert standard Katakana to Hiragana while preserving special characters like ヷ-ヺ, ㇰ-ㇿ, and Plane 1.
 */
export function katakanaToHiragana(input: string): string {
  const chars = Array.from(input);
  let out = '';
  for (const ch of chars) {
    const code = ch.codePointAt(0)!;
    // Standard Katakana ァ (0x30A1) .. ヶ (0x30F6)
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCodePoint(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Step B substitutions in strict longest-match-first order.
 */
const STEP_B_SUBSTITUTIONS: ReadonlyArray< readonly [string, string] > = [
  ['tty', 'tch'],
  ['ssy', 'shh'],
  ['tti', 'tchi'],
  ['ssi', 'shhi'],
  ['ttu', 'ttsu'],
  ['hhu', 'ffu'],
  ['ddi', 'ddji'],
  ['ddu', 'ddzu'],
  ['ddy', 'ddj'],
  ['zzi', 'jji'],
  ['zzy', 'jj'],
  ['ty', 'ch'],
  ['dy', 'dj'],
  ['sy', 'sh'],
  ['zy', 'j'],
  ['tu', 'tsu'],
  ['du', 'dzu'],
  ['ti', 'chi'],
  ['di', 'dji'],
  ['si', 'shi'],
  ['zi', 'ji'],
  ['hu', 'fu'],
];

const STEP_B_REGEX = new RegExp(
  STEP_B_SUBSTITUTIONS.map(([k]) => k).join('|'),
  'g'
);

const STEP_B_LOOKUP: Record<string, string> = Object.fromEntries(STEP_B_SUBSTITUTIONS);

function applyStepB(nihonShiki: string): string {
  return nihonShiki.replace(STEP_B_REGEX, (match) => STEP_B_LOOKUP[match] ?? match);
}

function applyStepC(romaji: string): string {
  // Preserve aa, ii, uu as-is; convert every ee => ei and oo => ou indiscriminately
  return romaji.replace(/ee/g, 'ei').replace(/oo/g, 'ou');
}

/**
 * Deterministic Custom 4-Way Yotsugana + Modified JSL Romanization Engine.
 * Flattens all romanized output strictly to lowercase.
 */
export function kanaToCustomRomaji(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Standalone sokuon tile
  if (trimmed === 'っ' || trimmed === 'ッ') {
    return 'tsu';
  }

  const normalized = katakanaToHiragana(trimmed);
  const chars = Array.from(normalized);
  const len = chars.length;

  let nihonOut = '';
  let pendingSokuon = 0;
  let i = 0;

  while (i < len) {
    const ch = chars[i];
    const next = i + 1 < len ? chars[i + 1] : '';

    // Sokuon (geminate っ)
    if (ch === 'っ') {
      pendingSokuon++;
      i++;
      continue;
    }

    // Chōonpu (ー): repeat preceding vowel
    if (ch === 'ー') {
      const m = nihonOut.match(/[aiueo](?!.*[aiueo])/);
      if (m) {
        nihonOut += m[0];
      }
      i++;
      continue;
    }

    // Moraic nasal ん
    if (ch === 'ん') {
      // Check next token's initial sound in Nihon-shiki
      let nextToken = '';
      if (next) {
        const pair = ch + next; // unused, check next + next2
        const next2 = i + 2 < len ? chars[i + 2] : '';
        nextToken = DIGRAPH_MAP[next + next2] || MONOGRAPH_MAP[next] || '';
      }
      const needsApostrophe = nextToken.length > 0 && /^[aiueoy]/.test(nextToken);
      nihonOut += needsApostrophe ? "n'" : 'n';
      pendingSokuon = 0;
      i++;
      continue;
    }

    // Check 2-char palatalized digraph first
    const pair = ch + next;
    if (next && DIGRAPH_MAP[pair]) {
      let token = DIGRAPH_MAP[pair];
      if (pendingSokuon > 0 && /^[bcdfghjklmnpqrstvwxyz]/.test(token)) {
        token = token[0].repeat(pendingSokuon) + token;
      }
      nihonOut += applyStepB(token);
      pendingSokuon = 0;
      i += 2;
      continue;
    }

    // Check 1-char monograph
    if (MONOGRAPH_MAP[ch]) {
      let token = MONOGRAPH_MAP[ch];
      if (pendingSokuon > 0 && /^[bcdfghjklmnpqrstvwxyz]/.test(token)) {
        token = token[0].repeat(pendingSokuon) + token;
      }
      nihonOut += applyStepB(token);
      pendingSokuon = 0;
      i++;
      continue;
    }

    // Ignore dots/hyphens if accidentally passed
    if (ch === '.' || ch === '-' || ch === ' ') {
      i++;
      continue;
    }

    // Pass through lowercase ASCII or punctuation
    nihonOut += ch.toLowerCase();
    pendingSokuon = 0;
    i++;
  }

  return applyStepC(nihonOut).toLowerCase();
}

/**
 * Also provide standard Hepburn romaji for live search matching so users can search
 * either by custom romaji (dji/dzu/tchi/shhi) or standard Hepburn (ji/zu/chi/shi).
 */
export function kanaToStandardRomaji(input: string): string {
  const custom = kanaToCustomRomaji(input);
  return custom
    .replace(/ddji/g, 'jji')
    .replace(/ddzu/g, 'zzu')
    .replace(/dji/g, 'ji')
    .replace(/dzu/g, 'zu')
    .replace(/dj/g, 'j')
    .replace(/shh/g, 'ssh');
}

/**
 * Parse a raw kanji reading (e.g. "おも.い", "かさ.ねる", "みっ.つ", "-づ.く", "ジュウ")
 * into Wiktionary-style { rootRomaji, okuriganaRomaji, ... } after historical yotsugana resolution.
 */
export function parseKanjiReading(
  rawReading: string,
  resolvedReadingKana: string,
  type: 'on' | 'kun'
): ParsedKanjiReading {
  // Strip leading/trailing affix hyphens and internal spaces/hyphens
  const cleaned = resolvedReadingKana.replace(/^-+|-+$/g, '').replace(/-/g, '').trim();
  const hiraCleaned = katakanaToHiragana(cleaned);

  const dotIndex = hiraCleaned.indexOf('.');
  if (dotIndex === -1) {
    const fullRomaji = kanaToCustomRomaji(hiraCleaned);
    return {
      raw: rawReading,
      resolvedKana: hiraCleaned,
      rootKana: hiraCleaned,
      okuriganaKana: '',
      rootRomaji: fullRomaji,
      okuriganaRomaji: '',
      fullRomaji,
      fullKana: hiraCleaned,
      hasOkurigana: false,
      type,
    };
  }

  const rootKana = hiraCleaned.slice(0, dotIndex);
  const okuriganaKana = hiraCleaned.slice(dotIndex + 1).replace(/\./g, '');
  const fullKana = rootKana + okuriganaKana;

  if (!okuriganaKana) {
    const fullRomaji = kanaToCustomRomaji(rootKana);
    return {
      raw: rawReading,
      resolvedKana: rootKana,
      rootKana,
      okuriganaKana: '',
      rootRomaji: fullRomaji,
      okuriganaRomaji: '',
      fullRomaji,
      fullKana: rootKana,
      hasOkurigana: false,
      type,
    };
  }

  const fullRomaji = kanaToCustomRomaji(fullKana);

  // Cross-boundary geminate handling: if rootKana ends in っ right before '.' (like みっ.つ -> mittsu)
  if (rootKana.endsWith('っ')) {
    const okuriAlone = kanaToCustomRomaji(okuriganaKana);
    if (okuriAlone && fullRomaji.endsWith(okuriAlone) && fullRomaji.length > okuriAlone.length) {
      return {
        raw: rawReading,
        resolvedKana: `${rootKana}.${okuriganaKana}`,
        rootKana,
        okuriganaKana,
        rootRomaji: fullRomaji.slice(0, fullRomaji.length - okuriAlone.length),
        okuriganaRomaji: okuriAlone,
        fullRomaji,
        fullKana,
        hasOkurigana: true,
        type,
      };
    }
    // Special case for ssya -> shha / ssi -> shhi across boundary
    const prefixKana = rootKana.slice(0, -1);
    const prefixRomaji = kanaToCustomRomaji(prefixKana);
    const clusterRomaji = fullRomaji.slice(prefixRomaji.length);
    return {
      raw: rawReading,
      resolvedKana: `${rootKana}.${okuriganaKana}`,
      rootKana,
      okuriganaKana,
      rootRomaji: prefixRomaji + (clusterRomaji[0] ?? ''),
      okuriganaRomaji: clusterRomaji.slice(1),
      fullRomaji,
      fullKana,
      hasOkurigana: true,
      type,
    };
  }

  let rootRomaji = kanaToCustomRomaji(rootKana);
  let okuriganaRomaji = kanaToCustomRomaji(okuriganaKana);

  // Handle cross-boundary long-vowel normalization if root ends in 'e'/'o' and okurigana starts with 'e'/'o'
  if (rootRomaji + okuriganaRomaji !== fullRomaji && fullRomaji.length === (rootRomaji + okuriganaRomaji).length) {
    rootRomaji = fullRomaji.slice(0, rootRomaji.length);
    okuriganaRomaji = fullRomaji.slice(rootRomaji.length);
  }

  return {
    raw: rawReading,
    resolvedKana: `${rootKana}.${okuriganaKana}`,
    rootKana,
    okuriganaKana,
    rootRomaji,
    okuriganaRomaji,
    fullRomaji,
    fullKana,
    hasOkurigana: true,
    type,
  };
}

/**
 * Deduplicate readings by unique rootRomaji (for kun readings) and fullRomaji (for on readings),
 * keeping the single most common/primary reading in KANJIDIC2/Wiktionary order for each root.
 * Selects the top maxCount (default 4) deduplicated readings overall per kanji.
 */
export function deduplicateKanjiReadings(
  onReadings: ParsedKanjiReading[],
  kunReadings: ParsedKanjiReading[],
  maxCount: number = 4
): {
  deduplicatedOn: ParsedKanjiReading[];
  deduplicatedKun: ParsedKanjiReading[];
  cardReadings: ParsedKanjiReading[];
} {
  const seenOn = new Set<string>();
  const deduplicatedOn: ParsedKanjiReading[] = [];
  for (const r of onReadings) {
    if (!r.fullRomaji) continue;
    if (!seenOn.has(r.fullRomaji)) {
      seenOn.add(r.fullRomaji);
      deduplicatedOn.push(r);
    }
  }

  const seenKunRoots = new Set<string>();
  const rawDeduplicatedKun: ParsedKanjiReading[] = [];
  for (const r of kunReadings) {
    if (!r.rootRomaji) continue;
    if (!seenKunRoots.has(r.rootRomaji)) {
      seenKunRoots.add(r.rootRomaji);
      rawDeduplicatedKun.push(r);
    }
  }

  // Keep KANJIDIC2 order, except put primary okurigana/multi-mora kun readings ahead of 1-char standalone affixes (like え in 重)
  const deduplicatedKun = [...rawDeduplicatedKun].sort((a, b) => {
    const aIsSingleAffix = !a.hasOkurigana && a.rootKana.length === 1 && rawDeduplicatedKun.length > 1 ? 1 : 0;
    const bIsSingleAffix = !b.hasOkurigana && b.rootKana.length === 1 && rawDeduplicatedKun.length > 1 ? 1 : 0;
    return aIsSingleAffix - bIsSingleAffix;
  });

  // Balance top card readings so both primary On and primary Kun roots appear cleanly (up to maxCount, default 4)
  const cardReadings: ParsedKanjiReading[] = [];
  if (deduplicatedOn.length > 0 && deduplicatedKun.length > 0) {
    const initialOn = deduplicatedOn.slice(0, 2);
    cardReadings.push(...initialOn);
    for (const k of deduplicatedKun) {
      if (cardReadings.length < maxCount) {
        cardReadings.push(k);
      }
    }
    for (const o of deduplicatedOn.slice(2)) {
      if (cardReadings.length < maxCount) {
        cardReadings.push(o);
      }
    }
  } else {
    for (const r of [...deduplicatedOn, ...deduplicatedKun]) {
      if (cardReadings.length < maxCount) {
        cardReadings.push(r);
      }
    }
  }

  return {
    deduplicatedOn,
    deduplicatedKun,
    cardReadings,
  };
}
