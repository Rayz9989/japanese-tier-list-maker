/**
 * Selective Historical Yotsugana Resolution for Kanji Readings.
 * Implements strict Yotsugana-Only Grafting from Wiktionary {{ja-readings|...}} templates
 * plus a comprehensive built-in fallback dictionary of Jōyō & Jinmeiyō historical ぢ/づ kanji.
 */

import { katakanaToHiragana } from './romaji';

/**
 * Built-in dictionary mapping Kanji -> array of reading stem replacements
 * [modernHiraganaStem, graftedYotsuganaHiraganaStem]
 * Applies only to yotsugana positions (じ -> ぢ, ず -> づ) while keeping modern vowels/rimes intact.
 */
export const BUILTIN_YOTSUGANA_STEMS: Record<string, ReadonlyArray<readonly [string, string]>> = {
  // Primary On-reading ぢゅう / ぢょ / ぢょう / ぢき / ぢ / ぢん / ぢく / づ kanji
  '重': [['じゅう', 'ぢゅう']],
  '女': [['じょ', 'ぢょ'], ['なんじ', 'なんぢ']],
  '場': [['じょう', 'ぢょう']],
  '丈': [['じょう', 'ぢょう']],
  '定': [['じょう', 'ぢょう']],
  '城': [['じょう', 'ぢょう'], ['きず', 'きづ']],
  '条': [['じょう', 'ぢょう'], ['すじ', 'すぢ']],
  '條': [['じょう', 'ぢょう'], ['すじ', 'すぢ']],
  '状': [['じょう', 'ぢょう']],
  '狀': [['じょう', 'ぢょう']],
  '畳': [['じょう', 'ぢょう']],
  '疊': [['じょう', 'ぢょう']],
  '嬢': [['じょう', 'ぢょう']],
  '孃': [['じょう', 'ぢょう']],
  '譲': [['じょう', 'ぢょう'], ['ゆず', 'ゆづ']],
  '讓': [['じょう', 'ぢょう'], ['ゆず', 'ゆづ']],
  '醸': [['じょう', 'ぢょう']],
  '釀': [['じょう', 'ぢょう']],
  '錠': [['じょう', 'ぢょう']],
  '杖': [['じょう', 'ぢょう']],
  '帖': [['じょう', 'ぢょう']],
  '直': [['じき', 'ぢき']],
  '治': [['じ', 'ぢ']],
  '持': [['じ', 'ぢ']],
  '時': [['じ', 'ぢ']],
  '痔': [['じ', 'ぢ']],
  '除': [['じょ', 'ぢょ'], ['じ', 'ぢ']],
  '叙': [['じょ', 'ぢょ']],
  '敍': [['じょ', 'ぢょ']],
  '序': [['じょ', 'ぢょ']],
  '陣': [['じん', 'ぢん']],
  '塵': [['じん', 'ぢん']],
  '腎': [['じん', 'ぢん']],
  '迅': [['じん', 'ぢん']],
  '尋': [['じん', 'ぢん'], ['たず', 'たづ']],
  '甚': [['じん', 'ぢん']],
  '図': [['ず', 'づ']],
  '圖': [['ず', 'づ']],
  '豆': [['ず', 'づ']],
  '頭': [['ず', 'づ'], ['じゅう', 'ぢゅう']],
  '途': [['ず', 'づ']],
  '都': [['ず', 'づ']],
  '厨': [['じゅう', 'ぢゅう'], ['ず', 'づ']],
  '軸': [['じく', 'ぢく']],
  '竺': [['じく', 'ぢく']],
  '紐': [['じゅう', 'ぢゅう']],
  '住': [['じゅう', 'ぢゅう']],
  '仲': [['じゅう', 'ぢゅう']],
  '虫': [['じゅう', 'ぢゅう']],
  '中': [['じゅう', 'ぢゅう']],
  '着': [['じゃく', 'ぢゃく']],
  '著': [['じゃく', 'ぢゃく']],
  // Primary Kun-reading & Mixed ぢ / づ kanji
  '恥': [['はじ', 'はぢ'], ['はずかし', 'はづかし']],
  '閉': [['とじ', 'とぢ']],
  '捻': [['ねじ', 'ねぢ']],
  '攀': [['よじ', 'よぢ']],
  '怖': [['おじ', 'おぢ']],
  '味': [['あじ', 'あぢ']],
  '築': [['きず', 'きづ']],
  '頷': [['うなず', 'うなづ']],
  '跪': [['ひざまず', 'ひざまづ']],
  '躓': [['つまず', 'つまづ']],
  '蹲': [['うずくま', 'うづくま']],
  '静': [['しず', 'しづ']],
  '靜': [['しず', 'しづ']],
  '鎮': [['しず', 'しづ']],
  '鎭': [['しず', 'しづ']],
  '沈': [['しず', 'しづ'], ['じん', 'ぢん']],
  '雫': [['しずく', 'しづく']],
  '貧': [['まず', 'まづ']],
  '難': [['むずか', 'むづか']],
  '雷': [['いかずち', 'いかづち'], ['あずま', 'あづま']],
  '東': [['あずま', 'あづま']],
  '吾': [['あずま', 'あづま']],
  '鯨': [['くじら', 'くぢら']],
  '藤': [['ふじ', 'ふぢ']],
  '肘': [['ひじ', 'ひぢ']],
  '路': [['じ', 'ぢ']],
  '自': [['みずか', 'みづか'], ['おのずか', 'おのづか'], ['おのず', 'おのづ']],
  '水': [['みず', 'みづ']],
  '瑞': [['みず', 'みづ']],
  '壬': [['みず', 'みづ']],
  '万': [['よろず', 'よろづ']],
  '萬': [['よろず', 'よろづ']],
  '屑': [['くず', 'くづ']],
  '崩': [['くず', 'くづ']],
  '葛': [['くず', 'くづ'], ['かずら', 'かづら']],
  '絆': [['きずな', 'きづな']],
  '傷': [['きず', 'きづ']],
  '創': [['きず', 'きづ']],
  '瑕': [['きず', 'きづ']],
  '梓': [['あずさ', 'あづさ']],
  '預': [['あず', 'あづ']],
  '与': [['あずか', 'あづか']],
  '與': [['あずか', 'あづか']],
  '出': [['いず', 'いづ']],
  '泉': [['いずみ', 'いづみ']],
  '何': [['いず', 'いづ']],
  '烏': [['いずく', 'いづく']],
  '鶴': [['たず', 'たづ']],
  '訪': [['たず', 'たづ']],
  '携': [['たずさ', 'たづさ']],
  '弾': [['はじ', 'はぢ'], ['はず', 'はづ']],
  '彈': [['はじ', 'はぢ'], ['はず', 'はづ']],
  '外': [['はず', 'はづ']],
  '筈': [['はず', 'はづ']],
  '辱': [['はずかし', 'はづかし'], ['はじ', 'はぢ']],
  '渦': [['うず', 'うづ']],
  '埋': [['うず', 'うづ']],
  '堆': [['うずたか', 'うづたか']],
  '鶉': [['うずら', 'うづら']],
  '珍': [['めずら', 'めづら'], ['ちん', 'ちん']],
  '愛': [['めず', 'めづ']],
  '数': [['かず', 'かづ']],
  '算': [['かず', 'かづ']],
  '舵': [['かじ', 'かぢ']],
  '梶': [['かじ', 'かぢ']],
  '楫': [['かじ', 'かぢ']],
  '櫂': [['じょう', 'ぢょう'], ['かじ', 'かぢ']],
  '鍛': [['かじ', 'かぢ']],
  '梢': [['かじ', 'かぢ']],
  '紅葉': [['もみじ', 'もみぢ']],
  '椛': [['もみじ', 'もみぢ']],
  '綴': [['つず', 'つづ']],
  '倹': [['つずま', 'つづま']],
  '儉': [['つずま', 'つづま']],
  '鼓': [['つずみ', 'つづみ']],
  '続': [['つず', 'つづ']],
  '先': [['まず', 'まづ']],
  '不': [['まず', 'まづ']],
  '汝': [['なんじ', 'なんぢ']],
  '爾': [['なんじ', 'なんぢ']],
  '乃': [['なんじ', 'なんぢ']],
  '而': [['なんじ', 'なんぢ']],
  '脳': [['なずき', 'なづき']],
  '髄': [['なずき', 'なづき']],
  '鮎': [['なまず', 'なまづ']],
  '鯰': [['なまず', 'なまづ']],
  '筋': [['すじ', 'すぢ']],
  '肇': [['じょう', 'ぢょう']],
  '鄭': [['じょう', 'ぢょう']],
};

/**
 * Checks if a kanji has any reading containing a potential yotsugana merger
 * (じ, ず, ジ, ズ, including じゃ/じゅ/じょ/ジャ/ジュ/ジョ).
 */
export function hasYotsuganaCandidate(readings: string[]): boolean {
  return readings.some((r) => /[じずジズ]/.test(r));
}

/**
 * Grafts ONLY historical ぢ/づ onto a modern reading based on its paired historical reading
 * from Wiktionary (e.g. "じゅう<ぢう" -> "ぢゅう", "じょう<でふ" -> "ぢょう", "はじ-る<はぢ-る" -> "はぢ-る").
 * Never alters vowels or labials (so "じゅう<じふ" stays "じゅう").
 */
export function graftYotsuganaPair(modernRaw: string, historicalRaw: string): string {
  const modClean = katakanaToHiragana(modernRaw.replace(/[\.\-\s]/g, ''));
  const histClean = katakanaToHiragana(historicalRaw.replace(/[\.\-\s]/g, ''));

  if (!modClean || !histClean) return modernRaw;

  // Special dental palatalization cases in On-readings:
  // Modern じょう/じょ from historical ぢ.../でう/でふ (e.g. 場 じょう<ぢやう, 条 じょう<でう, 畳 じょう<でふ)
  if (modClean.startsWith('じょ') && (histClean.startsWith('ぢ') || histClean.startsWith('でう') || histClean.startsWith('でふ'))) {
    return replaceInitialJiOrZu(modernRaw, 'ji_to_dji');
  }
  if (modClean.startsWith('じゅ') && (histClean.startsWith('ぢ') || histClean.startsWith('づ'))) {
    return replaceInitialJiOrZu(modernRaw, 'ji_to_dji');
  }
  if (modClean.startsWith('じゃ') && histClean.startsWith('ぢ')) {
    return replaceInitialJiOrZu(modernRaw, 'ji_to_dji');
  }

  // General positional yotsugana check:
  // Count occurrences of じ/ず in modern and check if historical has ぢ/づ
  let result = modernRaw;
  if (/[じジ]/.test(result) && histClean.includes('ぢ')) {
    // Replace じ/ジ with ぢ/ヂ
    result = result.replace(/じ/g, 'ぢ').replace(/ジ/g, 'ヂ');
  }
  if (/[ずズ]/.test(result) && histClean.includes('づ')) {
    // Replace ず/ズ with づ/ヅ
    result = result.replace(/ず/g, 'づ').replace(/ズ/g, 'ヅ');
  }

  return result;
}

function replaceInitialJiOrZu(raw: string, mode: 'ji_to_dji' | 'zu_to_dzu'): string {
  if (mode === 'ji_to_dji') {
    return raw.replace(/^([-]*)(じ|ジ)/, (_, p1, ch) => p1 + (ch === 'ジ' ? 'ヂ' : 'ぢ'));
  }
  return raw.replace(/^([-]*)(ず|ズ)/, (_, p1, ch) => p1 + (ch === 'ズ' ? 'ヅ' : 'づ'));
}

/**
 * Parse a Wiktionary {{ja-readings|...}} template string into a list of
 * [modernStemClean, graftedStemClean] pairs for a kanji.
 */
export function parseWiktionaryJaReadings(wikitext: string): Array<readonly [string, string]> {
  const pairs: Array<readonly [string, string]> = [];
  if (!wikitext) return pairs;

  const templates = wikitext.match(/\{\{ja-readings[\s\S]*?\}\}/g);
  if (!templates) return pairs;

  for (const tpl of templates) {
    // Split template parameters by |
    const inner = tpl.replace(/^\{\{ja-readings\s*\|?/, '').replace(/\}\}$/, '');
    const params = inner.split('|');
    for (const param of params) {
      const eqIdx = param.indexOf('=');
      const val = eqIdx >= 0 ? param.slice(eqIdx + 1) : param;
      // Split comma-separated reading items
      const items = val.split(',');
      for (const item of items) {
        const trimmed = item.trim();
        if (!trimmed) continue;
        if (trimmed.includes('<')) {
          const parts = trimmed.split('<').map((s) => s.trim());
          const modPart = parts[0];
          // Check all historical parts in the chain (e.g., おんな-<をんな-<をみな- or じん<ぢむ)
          for (let i = 1; i < parts.length; i++) {
            const histPart = parts[i];
            const grafted = graftYotsuganaPair(modPart, histPart);
            const modStem = katakanaToHiragana(modPart.replace(/[\.\-\s]/g, ''));
            const graftedStem = katakanaToHiragana(grafted.replace(/[\.\-\s]/g, ''));
            if (modStem && graftedStem && modStem !== graftedStem) {
              pairs.push([modStem, graftedStem]);
              // Also extract the root before '-' if modPart had '-' (e.g. しず-く<しづ-く -> しず -> しづ)
              const dashIdx = modPart.indexOf('-');
              const graftedDashIdx = grafted.indexOf('-');
              if (dashIdx > 0 && graftedDashIdx > 0) {
                const modRoot = katakanaToHiragana(modPart.slice(0, dashIdx).replace(/\./g, ''));
                const graftedRoot = katakanaToHiragana(grafted.slice(0, graftedDashIdx).replace(/\./g, ''));
                if (modRoot && graftedRoot && modRoot !== graftedRoot) {
                  pairs.push([modRoot, graftedRoot]);
                }
              }
              break;
            }
          }
        } else if (/[ぢづヂヅ]/.test(trimmed)) {
          // Reading already explicitly written with ぢ/づ in Wiktionary (e.g., ちかづ-く, つづみ)
          const graftedStem = katakanaToHiragana(trimmed.replace(/[\.\-\s]/g, ''));
          const modStem = graftedStem.replace(/ぢ/g, 'じ').replace(/づ/g, 'ず');
          if (modStem !== graftedStem) {
            pairs.push([modStem, graftedStem]);
          }
        }
      }
    }
  }

  return pairs;
}

/**
 * Resolve a single kanji reading (e.g., "ジュウ", "おも.い", "は.じる", "きず.く")
 * using both Wiktionary-extracted stem pairs and the built-in yotsugana dictionary.
 * Preserves any '.' okurigana boundary marker in the reading.
 */
export function resolveKanjiReadingYotsugana(
  kanji: string,
  rawReading: string,
  wiktionaryPairs?: ReadonlyArray<readonly [string, string]>
): string {
  const cleaned = katakanaToHiragana(rawReading.replace(/^-+|-+$/g, '').replace(/-/g, '').trim());
  if (!/[じず]/.test(cleaned)) {
    return cleaned;
  }

  const allPairs: Array<readonly [string, string]> = [
    ...(wiktionaryPairs ?? []),
    ...(BUILTIN_YOTSUGANA_STEMS[kanji] ?? []),
  ];

  if (allPairs.length === 0) {
    return cleaned;
  }

  // Strip '.' to match against stem pairs, while recording dot position
  const dotIdx = cleaned.indexOf('.');
  const noDot = cleaned.replace(/\./g, '');

  // Sort pairs by longest modern stem first so specific matches win over short prefixes
  const sortedPairs = [...allPairs].sort((a, b) => b[0].length - a[0].length);

  for (const [modStem, graftedStem] of sortedPairs) {
    if (modStem.length !== graftedStem.length) continue;

    // For short 1-2 char On-readings (like じ, ず, じょ), require exact match if no okurigana,
    // or prefix match if okurigana is present
    if (noDot === modStem || (dotIdx > 0 && noDot.startsWith(modStem))) {
      const replacedNoDot = graftedStem + noDot.slice(modStem.length);
      if (dotIdx === -1) {
        return replacedNoDot;
      }
      return replacedNoDot.slice(0, dotIdx) + '.' + replacedNoDot.slice(dotIdx);
    }
  }

  return cleaned;
}
