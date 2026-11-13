import { CharacterItem, KanaSubtag } from '../types/characters';
import { kanaToCustomRomaji, kanaToStandardRomaji } from '../utils/romaji';

interface RawKanaDef {
  char: string;
  script: 'hiragana' | 'katakana';
  subtag: KanaSubtag;
  strokes: number;
  note?: string;
}

const SIMPLE_HIRAGANA: Array<[string, number]> = [
  ['あ', 3], ['い', 2], ['う', 2], ['え', 2], ['お', 3],
  ['か', 3], ['き', 4], ['く', 1], ['け', 3], ['こ', 2],
  ['さ', 3], ['し', 1], ['す', 2], ['せ', 3], ['そ', 1],
  ['た', 4], ['ち', 2], ['つ', 1], ['て', 1], ['と', 2],
  ['な', 4], ['に', 3], ['ぬ', 2], ['ね', 2], ['の', 1],
  ['は', 3], ['ひ', 1], ['ふ', 4], ['へ', 1], ['ほ', 4],
  ['ま', 3], ['み', 2], ['む', 3], ['め', 2], ['も', 3],
  ['や', 3], ['ゆ', 2], ['よ', 2],
  ['ら', 2], ['り', 2], ['る', 1], ['れ', 2], ['ろ', 1],
  ['わ', 2], ['を', 3], ['ん', 1],
];

const SIMPLE_KATAKANA: Array<[string, number]> = [
  ['ア', 2], ['イ', 2], ['ウ', 3], ['エ', 3], ['オ', 3],
  ['カ', 2], ['キ', 3], ['ク', 2], ['ケ', 3], ['コ', 2],
  ['サ', 3], ['シ', 3], ['ス', 2], ['セ', 2], ['ソ', 2],
  ['タ', 3], ['チ', 3], ['ツ', 3], ['テ', 3], ['ト', 2],
  ['ナ', 2], ['ニ', 2], ['ヌ', 2], ['ネ', 4], ['ノ', 1],
  ['ハ', 2], ['ヒ', 2], ['フ', 1], ['ヘ', 1], ['ホ', 4],
  ['マ', 2], ['ミ', 3], ['ム', 2], ['メ', 2], ['モ', 3],
  ['ヤ', 2], ['ユ', 2], ['ヨ', 3],
  ['ラ', 2], ['リ', 2], ['ル', 2], ['レ', 1], ['ロ', 3],
  ['ワ', 2], ['ヲ', 3], ['ン', 2],
];

const VOICED_HIRAGANA: Array<[string, number]> = [
  ['が', 5], ['ぎ', 6], ['ぐ', 3], ['げ', 5], ['ご', 4],
  ['ざ', 5], ['じ', 3], ['ず', 4], ['ぜ', 5], ['ぞ', 3],
  ['だ', 6], ['ぢ', 4], ['づ', 3], ['で', 3], ['ど', 4],
  ['ば', 5], ['び', 3], ['ぶ', 6], ['べ', 3], ['ぼ', 6],
  ['ぱ', 4], ['ぴ', 2], ['ぷ', 5], ['ぺ', 2], ['ぽ', 5],
  ['ゔ', 4],
];

const VOICED_KATAKANA: Array<[string, number]> = [
  ['ガ', 4], ['ギ', 5], ['グ', 4], ['ゲ', 5], ['ゴ', 4],
  ['ザ', 5], ['ジ', 5], ['ズ', 4], ['ゼ', 4], ['ゾ', 4],
  ['ダ', 5], ['ヂ', 5], ['ヅ', 5], ['デ', 5], ['ド', 4],
  ['バ', 4], ['ビ', 4], ['ブ', 3], ['ベ', 3], ['ボ', 6],
  ['パ', 3], ['ピ', 3], ['プ', 2], ['ペ', 2], ['ポ', 5],
  ['ヴ', 5], ['ヷ', 4], ['ヸ', 5], ['ヹ', 5], ['ヺ', 5],
];

const SMALL_HIRAGANA: Array<[string, number]> = [
  ['ぁ', 3], ['ぃ', 2], ['ぅ', 2], ['ぇ', 2], ['ぉ', 3],
  ['っ', 1], ['ゃ', 3], ['ゅ', 2], ['ょ', 2], ['ゎ', 2],
  ['ゕ', 3], ['ゖ', 3],
];

const SMALL_KATAKANA: Array<[string, number]> = [
  ['ァ', 2], ['ィ', 2], ['ゥ', 3], ['ェ', 3], ['ォ', 3],
  ['ッ', 3], ['ャ', 2], ['ュ', 2], ['ョ', 3], ['ヮ', 2],
  ['ヵ', 2], ['ヶ', 3],
  ['ㇰ', 2], ['ㇱ', 3], ['ㇲ', 2], ['ㇳ', 2],
  ['ㇴ', 2], ['ㇵ', 2], ['ㇶ', 2], ['ㇷ', 1],
  ['ㇸ', 1], ['ㇹ', 4], ['ㇺ', 2], ['ㇻ', 2],
  ['ㇼ', 2], ['ㇽ', 2], ['ㇾ', 1], ['ㇿ', 3],
];

const HISTORICAL_KANA: RawKanaDef[] = [
  { char: 'ゐ', script: 'hiragana', subtag: 'historical_kana', strokes: 1, note: 'Historical Hiragana Wi' },
  { char: 'ゑ', script: 'hiragana', subtag: 'historical_kana', strokes: 1, note: 'Historical Hiragana We' },
  { char: 'ヰ', script: 'katakana', subtag: 'historical_kana', strokes: 4, note: 'Historical Katakana Wi' },
  { char: 'ヱ', script: 'katakana', subtag: 'historical_kana', strokes: 3, note: 'Historical Katakana We' },
  { char: '𛀆', script: 'hiragana', subtag: 'historical_kana', strokes: 2, note: 'Archaic Hiragana Yi (U+1B006)' },
  { char: '𛀁', script: 'hiragana', subtag: 'historical_kana', strokes: 3, note: 'Archaic Hiragana Ye (U+1B001)' },
  { char: '𛄟', script: 'hiragana', subtag: 'historical_kana', strokes: 3, note: 'Archaic Hiragana Wu (U+1B11F)' },
  { char: '𛄠', script: 'katakana', subtag: 'historical_kana', strokes: 3, note: 'Archaic Katakana Yi (U+1B120)' },
  { char: '𛄡', script: 'katakana', subtag: 'historical_kana', strokes: 3, note: 'Archaic Katakana Ye (U+1B121)' },
  { char: '𛄢', script: 'katakana', subtag: 'historical_kana', strokes: 3, note: 'Archaic Katakana Wu (U+1B122)' },
];

interface RawLigatureDef {
  id: string;
  char: string;
  romaji: string;
  kana: string;
  strokes: number;
  description: string;
}

const RAW_LIGATURES: RawLigatureDef[] = [
  { id: 'lig_309F', char: 'ゟ', romaji: 'yori', kana: 'より', strokes: 2, description: 'Hiragana digraph Yori (より)' },
  { id: 'lig_30FF', char: 'ヿ', romaji: 'koto', kana: 'こと', strokes: 2, description: 'Katakana digraph Koto (コト)' },
  { id: 'lig_2A708', char: '𪜈', romaji: 'tomo', kana: 'とも', strokes: 3, description: 'Katakana digraph Tomo (トモ)' },
  { id: 'lig_2CF00', char: '𬼀', romaji: 'shite', kana: 'して', strokes: 2, description: 'Hiragana digraph Shite (して)' },
  { id: 'lig_2CEFF', char: '𬻿', romaji: 'nari', kana: 'なり', strokes: 3, description: 'Hiragana digraph Nari (なり)' },
  { id: 'lig_2CF02', char: '𬼂', romaji: 'nari', kana: 'なり', strokes: 2, description: 'Katakana digraph Nari (ナリ)' },
  // 4 PUA historical gōryakugana (evaluated at runtime by the offscreen canvas Tofu Detector)
  { id: 'lig_E850', char: '\uE850', romaji: 'koto', kana: 'こと', strokes: 2, description: 'Hiragana digraph Koto (こと)' },
  { id: 'lig_E851', char: '\uE851', romaji: 'toki', kana: 'とき', strokes: 4, description: 'Katakana digraph Toki (トキ)' },
  { id: 'lig_E852', char: '\uE852', romaji: 'tote', kana: 'とて', strokes: 3, description: 'Hiragana digraph Tote (とて)' },
  { id: 'lig_E853', char: '\uE853', romaji: 'yori', kana: 'より', strokes: 3, description: 'Katakana digraph Yori (ヨリ)' },
];

interface RawSymbolDef {
  char: string;
  nameEn: string;
  readingsKana: string[];
  strokes: number;
}

/**
 * Native Japanese Symbols & Punctuation Dataset (strictly excluding Western-loaned marks like ・, ！, ？).
 */
const RAW_SYMBOLS: RawSymbolDef[] = [
  { char: '〇', nameEn: 'Ideographic Zero', readingsKana: ['まる', 'れい'], strokes: 1 },
  { char: '〆', nameEn: 'Closing Mark', readingsKana: ['しめ'], strokes: 2 },
  { char: '々', nameEn: 'Kanji Iteration Mark', readingsKana: ['のま', 'おどりじ'], strokes: 3 },
  { char: '仝', nameEn: 'Ditto/Same', readingsKana: ['どう', 'おなじ'], strokes: 5 },
  { char: '〒', nameEn: 'Postal Mark', readingsKana: ['ゆうびんきごう'], strokes: 3 },
  { char: 'ゝ', nameEn: 'Hiragana Iteration Mark', readingsKana: ['くりかえし', 'おどりじ'], strokes: 1 },
  { char: 'ゞ', nameEn: 'Voiced Hiragana Iteration', readingsKana: ['くりかえし'], strokes: 3 },
  { char: 'ヽ', nameEn: 'Katakana Iteration Mark', readingsKana: ['くりかえし'], strokes: 1 },
  { char: 'ヾ', nameEn: 'Voiced Katakana Iteration', readingsKana: ['くりかえし'], strokes: 3 },
  { char: '※', nameEn: 'Reference Mark', readingsKana: ['こめじるし'], strokes: 6 },
  { char: '〃', nameEn: 'Ditto Mark', readingsKana: ['おなじ', 'ちょんちょん'], strokes: 2 },
  { char: '〻', nameEn: 'Ninojiten Mark', readingsKana: ['にのじてん'], strokes: 2 },
  { char: '〼', nameEn: 'Masu Mark', readingsKana: ['ます'], strokes: 2 },
  { char: '〽', nameEn: 'Ioriten/Song Mark', readingsKana: ['いおりてん'], strokes: 2 },
  { char: '〠', nameEn: 'Postal Face Mark', readingsKana: ['ナンバーくん'], strokes: 7 },
  { char: '〶', nameEn: 'Circled Postal Mark', readingsKana: ['ちづゆうびんきょく'], strokes: 4 },
  { char: 'ー', nameEn: 'Long Vowel Mark', readingsKana: ['ちょうおんぷ', 'のばしぼう'], strokes: 1 },
  { char: '〜', nameEn: 'Wave Dash', readingsKana: ['なみダッシュ', 'から'], strokes: 1 },
  { char: '、', nameEn: 'Ideographic Comma', readingsKana: ['てん', 'とうてん'], strokes: 1 },
  { char: '。', nameEn: 'Ideographic Full Stop', readingsKana: ['まる', 'くてん'], strokes: 1 },
  { char: '「', nameEn: 'Left Corner Bracket', readingsKana: ['かぎかっこ'], strokes: 1 },
  { char: '」', nameEn: 'Right Corner Bracket', readingsKana: ['かぎかっこ'], strokes: 1 },
  { char: '『', nameEn: 'Left White Corner Bracket', readingsKana: ['にじゅうかぎかっこ'], strokes: 2 },
  { char: '』', nameEn: 'Right White Corner Bracket', readingsKana: ['にじゅうかぎかっこ'], strokes: 2 },
  { char: '【', nameEn: 'Left Lenticular Bracket', readingsKana: ['すみつきかっこ'], strokes: 1 },
  { char: '】', nameEn: 'Right Lenticular Bracket', readingsKana: ['すみつきかっこ'], strokes: 1 },
  { char: '〔', nameEn: 'Left Tortoise Shell Bracket', readingsKana: ['きっこうかっこ'], strokes: 1 },
  { char: '〕', nameEn: 'Right Tortoise Shell Bracket', readingsKana: ['きっこうかっこ'], strokes: 1 },
  { char: '〈', nameEn: 'Left Angle Bracket', readingsKana: ['やまかっこ'], strokes: 1 },
  { char: '〉', nameEn: 'Right Angle Bracket', readingsKana: ['やまかっこ'], strokes: 1 },
  { char: '《', nameEn: 'Left Double Angle Bracket', readingsKana: ['にじゅうやまかっこ'], strokes: 2 },
  { char: '》', nameEn: 'Right Double Angle Bracket', readingsKana: ['にじゅうやまかっこ'], strokes: 2 },
  { char: '゛', nameEn: 'Voiced Sound Mark', readingsKana: ['だくてん', 'てんてん'], strokes: 2 },
  { char: '゜', nameEn: 'Semi-Voiced Sound Mark', readingsKana: ['はんだくてん', 'まる'], strokes: 1 },
];

export function buildBuiltinKanaAndSymbols(startOrderIndex: number = 10000): CharacterItem[] {
  const items: CharacterItem[] = [];
  let order = startOrderIndex;

  const addKana = (char: string, script: 'hiragana' | 'katakana', subtag: KanaSubtag, strokes: number, note?: string) => {
    const romaji = kanaToCustomRomaji(char);
    const stdRomaji = kanaToStandardRomaji(char);
    const code = char.codePointAt(0) ?? 0;
    const unicodeHex = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
    const isYotsugana = ['じ', 'ぢ', 'ず', 'づ', 'ジ', 'ヂ', 'ズ', 'ヅ'].includes(char);
    items.push({
      id: `kana_${code.toString(16)}`,
      char,
      category: script,
      kanaSubtag: subtag,
      // Card Text Rule for Kana: ONLY its lowercase custom-romanized syllable in Middle Zone, Bottom Zone BLANK
      middleText: romaji,
      bottomText: '',
      meanings: [note || `${script === 'hiragana' ? 'Hiragana' : 'Katakana'} syllable ${romaji}`],
      strokes,
      grade: null,
      frequency: null,
      unicodePoint: code,
      unicodeHex,
      catalogOrder: order++,
      searchIndex: `${char} ${romaji} ${stdRomaji} ${script} ${subtag} ${note || ''}`.toLowerCase(),
      hasYotsuganaResolution: isYotsugana,
    });
  };

  for (const [ch, st] of SIMPLE_HIRAGANA) addKana(ch, 'hiragana', 'simple_kana', st);
  for (const [ch, st] of VOICED_HIRAGANA) addKana(ch, 'hiragana', 'voiced_kana', st);
  for (const [ch, st] of SMALL_HIRAGANA) addKana(ch, 'hiragana', 'small_kana', st);

  for (const [ch, st] of SIMPLE_KATAKANA) addKana(ch, 'katakana', 'simple_kana', st);
  for (const [ch, st] of VOICED_KATAKANA) addKana(ch, 'katakana', 'voiced_kana', st);
  for (const [ch, st] of SMALL_KATAKANA) addKana(ch, 'katakana', 'small_kana', st);

  for (const h of HISTORICAL_KANA) {
    addKana(h.char, h.script, h.subtag, h.strokes, h.note);
  }

  for (const lig of RAW_LIGATURES) {
    const code = lig.char.codePointAt(0) ?? 0;
    const unicodeHex = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
    const romaji = lig.romaji.toLowerCase();
    items.push({
      id: lig.id,
      char: lig.char,
      category: 'ligature',
      // Card Text Rule for Ligatures: ONLY the lowercase custom-romanized word in Middle Zone, Bottom Zone BLANK
      middleText: romaji,
      bottomText: '',
      meanings: [lig.description],
      strokes: lig.strokes,
      grade: null,
      frequency: null,
      unicodePoint: code,
      unicodeHex,
      catalogOrder: order++,
      searchIndex: `${lig.char} ${lig.kana} ${romaji} ${lig.description}`.toLowerCase(),
    });
  }

  for (const sym of RAW_SYMBOLS) {
    const code = sym.char.codePointAt(0) ?? 0;
    const unicodeHex = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
    const romajiReadings = sym.readingsKana.map((k) => kanaToCustomRomaji(k));
    const stdReadings = sym.readingsKana.map((k) => kanaToStandardRomaji(k));
    const bottomText = romajiReadings.join('/');
    const bottomKanaText = sym.readingsKana.join('/');
    items.push({
      id: `sym_${code.toString(16)}`,
      char: sym.char,
      category: 'symbol',
      // Card Text Rule for Symbols: English name in Middle Zone, lowercase custom-romanized Japanese reading(s) joined by tight / in Bottom Zone
      middleText: sym.nameEn,
      bottomText,
      bottomKanaText,
      meanings: [sym.nameEn],
      strokes: sym.strokes,
      grade: null,
      frequency: null,
      unicodePoint: code,
      unicodeHex,
      catalogOrder: order++,
      searchIndex: `${sym.char} ${sym.nameEn} ${bottomText} ${stdReadings.join(' ')} ${sym.readingsKana.join(' ')} symbol`.toLowerCase(),
      hasYotsuganaResolution: sym.readingsKana.some((k) => /[じずぢづ]/.test(k)),
    });
  }

  return items;
}

/**
 * Runtime Font-Support Tofu Detector:
 * After document.fonts.ready, verifies non-Jōyō/archaic/ligature glyphs on an offscreen <canvas>
 * against \uFFFF in 'M PLUS 1 Code', 'Noto Sans JP' and returns a Set of unsupported item IDs to hide.
 */
export async function detectUnsupportedGlyphIds(items: CharacterItem[]): Promise<Set<string>> {
  const unsupported = new Set<string>();
  if (typeof document === 'undefined') return unsupported;

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return unsupported;

    const getSignature = (glyph: string): string => {
      ctx.clearRect(0, 0, 48, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = "36px 'M PLUS 1 Code', 'Noto Sans JP', sans-serif";
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(glyph, 24, 24);
      const data = ctx.getImageData(0, 0, 48, 48).data;
      let nonZero = 0;
      let hash = 0;
      for (let i = 3; i < data.length; i += 4) {
        const alpha = data[i];
        if (alpha > 16) {
          nonZero++;
          hash = (hash * 31 + i + alpha) | 0;
        }
      }
      if (nonZero === 0) return 'EMPTY';
      return `${nonZero}:${hash}`;
    };

    const tofuSig1 = getSignature('\uFFFF');
    const tofuSig2 = getSignature('\uE899');

    for (const item of items) {
      // Check PUA ligatures, Plane 1 archaic kana, and rare Jinmeiyō/Ligatures
      const code = item.unicodePoint;
      const isPua = code >= 0xe000 && code <= 0xf8ff;
      if (isPua) {
        unsupported.add(item.id);
        continue;
      }
      if (
        item.category === 'ligature' ||
        item.kanaSubtag === 'historical_kana' ||
        code > 0xffff
      ) {
        const sig = getSignature(item.char);
        if (sig === 'EMPTY' || sig === tofuSig1 || sig === tofuSig2) {
          unsupported.add(item.id);
        }
      }
    }
  } catch {
    // Fallback: always hide Private Use Area codepoints that have no Unicode font coverage
    for (const item of items) {
      if (item.unicodePoint >= 0xe000 && item.unicodePoint <= 0xf8ff) {
        unsupported.add(item.id);
      }
    }
  }

  return unsupported;
}
