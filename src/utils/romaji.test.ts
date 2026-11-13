import test from 'node:test';
import assert from 'node:assert/strict';
import {
  kanaToCustomRomaji,
  parseKanjiReading,
  deduplicateKanjiReadings,
} from './romaji';
import {
  parseWiktionaryJaReadings,
  resolveKanjiReadingYotsugana,
} from './yotsugana';
import { seededShuffle } from './prng';
import {
  BASE_DEFINITION_FONT_SIZE,
  BASE_READING_FONT_SIZE,
  computeMiddleZoneLayout,
} from './cardLayout';
import {
  buildKanjiCharacterItem,
  extractWiktionaryMeanings,
} from '../services/dataLoader';

test('Custom 4-way Yotsugana + Modified JSL Romanization Engine — base & 4-way yotsugana', () => {
  assert.equal(kanaToCustomRomaji('し'), 'shi');
  assert.equal(kanaToCustomRomaji('ち'), 'chi');
  assert.equal(kanaToCustomRomaji('つ'), 'tsu');
  assert.equal(kanaToCustomRomaji('ふ'), 'fu');
  assert.equal(kanaToCustomRomaji('じ'), 'ji');
  assert.equal(kanaToCustomRomaji('ぢ'), 'dji');
  assert.equal(kanaToCustomRomaji('ず'), 'zu');
  assert.equal(kanaToCustomRomaji('づ'), 'dzu');

  // Palatalized yōon
  assert.equal(kanaToCustomRomaji('しゃ'), 'sha');
  assert.equal(kanaToCustomRomaji('ちゃ'), 'cha');
  assert.equal(kanaToCustomRomaji('じゃ'), 'ja');
  assert.equal(kanaToCustomRomaji('じゅ'), 'ju');
  assert.equal(kanaToCustomRomaji('じょ'), 'jo');
  assert.equal(kanaToCustomRomaji('ぢゃ'), 'dja');
  assert.equal(kanaToCustomRomaji('ぢゅ'), 'dju');
  assert.equal(kanaToCustomRomaji('ぢょ'), 'djo');

  // Archaic & historical kana
  assert.equal(kanaToCustomRomaji('ゐ'), 'wi');
  assert.equal(kanaToCustomRomaji('ゑ'), 'we');
  assert.equal(kanaToCustomRomaji('を'), 'wo');
  assert.equal(kanaToCustomRomaji('𛀆'), 'yi');
  assert.equal(kanaToCustomRomaji('𛄠'), 'yi');
  assert.equal(kanaToCustomRomaji('𛀁'), 'ye');
  assert.equal(kanaToCustomRomaji('𛄡'), 'ye');
  assert.equal(kanaToCustomRomaji('𛄟'), 'wu');
  assert.equal(kanaToCustomRomaji('𛄢'), 'wu');
  assert.equal(kanaToCustomRomaji('ヷヸヴヹヺ'), 'vavivuvevo');
});

test('Custom Geminates (Step B longest-match-first) & JSL Long Vowels (Step C)', () => {
  assert.equal(kanaToCustomRomaji('っち'), 'tchi');
  assert.equal(kanaToCustomRomaji('っちゃ'), 'tcha');
  assert.equal(kanaToCustomRomaji('っちゅ'), 'tchu');
  assert.equal(kanaToCustomRomaji('っちょ'), 'tcho');
  assert.equal(kanaToCustomRomaji('っし'), 'shhi');
  assert.equal(kanaToCustomRomaji('っしゃ'), 'shha');
  assert.equal(kanaToCustomRomaji('っしゅ'), 'shhu');
  assert.equal(kanaToCustomRomaji('っしょ'), 'shho');
  assert.equal(kanaToCustomRomaji('っつ'), 'ttsu');
  assert.equal(kanaToCustomRomaji('っふ'), 'ffu');
  assert.equal(kanaToCustomRomaji('っぢ'), 'ddji');
  assert.equal(kanaToCustomRomaji('っづ'), 'ddzu');
  assert.equal(kanaToCustomRomaji('っぢゃ'), 'ddja');
  assert.equal(kanaToCustomRomaji('っじ'), 'jji');
  assert.equal(kanaToCustomRomaji('っじゃ'), 'jja');

  // Step C: JSL long vowels (ee -> ei, oo -> ou, aa/ii/uu preserved)
  assert.equal(kanaToCustomRomaji('ねえ'), 'nei');
  assert.equal(kanaToCustomRomaji('おお'), 'ou');
  assert.equal(kanaToCustomRomaji('とお'), 'tou');
  assert.equal(kanaToCustomRomaji('おう'), 'ou');
  assert.equal(kanaToCustomRomaji('おかあさん'), 'okaasan');
  assert.equal(kanaToCustomRomaji('ちいさい'), 'chiisai');
  assert.equal(kanaToCustomRomaji('ゆうびんきごう'), 'yuubinkigou');
  assert.equal(kanaToCustomRomaji('ちづゆうびんきょく'), 'chidzuyuubinkyoku');

  // Chōonpu expansion + Step C
  assert.equal(kanaToCustomRomaji('コーヒー'), 'kouhii');
  assert.equal(kanaToCustomRomaji('メーデー'), 'meidei');

  // Moraic nasal n' before vowels or y
  assert.equal(kanaToCustomRomaji('たんい'), "tan'i");
  assert.equal(kanaToCustomRomaji('ほんや'), "hon'ya");
  assert.equal(kanaToCustomRomaji('しんぶん'), 'shinbun');
});

test('Wiktionary-style Kanji Root Underlining & Cross-Boundary Geminate Handling', () => {
  const omoi = parseKanjiReading('おも.い', 'おも.い', 'kun');
  assert.equal(omoi.hasOkurigana, true);
  assert.equal(omoi.rootRomaji, 'omo');
  assert.equal(omoi.okuriganaRomaji, 'i');
  assert.equal(omoi.fullRomaji, 'omoi');

  const kasaneru = parseKanjiReading('かさ.ねる', 'かさ.ねる', 'kun');
  assert.equal(kasaneru.hasOkurigana, true);
  assert.equal(kasaneru.rootRomaji, 'kasa');
  assert.equal(kasaneru.okuriganaRomaji, 'neru');
  assert.equal(kasaneru.fullRomaji, 'kasaneru');

  const mittsu = parseKanjiReading('みっ.つ', 'みっ.つ', 'kun');
  assert.equal(mittsu.hasOkurigana, true);
  assert.equal(mittsu.rootRomaji, 'mit');
  assert.equal(mittsu.okuriganaRomaji, 'tsu');
  assert.equal(mittsu.fullRomaji, 'mittsu');

  const standaloneTe = parseKanjiReading('て', 'て', 'kun');
  assert.equal(standaloneTe.hasOkurigana, false);
  assert.equal(standaloneTe.rootRomaji, 'te');
  assert.equal(standaloneTe.okuriganaRomaji, '');
});

test('Stem Deduplication for的重 (djuu/chou/omoi/kasaneru)', () => {
  const rawOn = ['ジュウ', 'チョウ'];
  const rawKun = ['え', 'おも.い', 'おも.り', 'おも.なう', 'かさ.ねる', 'かさ.なる', 'おも'];

  const parsedOn = rawOn.map((r) =>
    parseKanjiReading(r, resolveKanjiReadingYotsugana('重', r), 'on')
  );
  const parsedKun = rawKun.map((r) =>
    parseKanjiReading(r, resolveKanjiReadingYotsugana('重', r), 'kun')
  );

  const { deduplicatedOn, deduplicatedKun, cardReadings } = deduplicateKanjiReadings(
    parsedOn,
    parsedKun,
    5
  );

  assert.deepEqual(
    deduplicatedOn.map((r) => r.fullRomaji),
    ['djuu', 'chou']
  );
  assert.deepEqual(
    deduplicatedKun.map((r) => r.fullRomaji),
    ['omoi', 'kasaneru', 'e']
  );
  assert.deepEqual(
    cardReadings.slice(0, 4).map((r) => r.fullRomaji),
    ['djuu', 'chou', 'omoi', 'kasaneru']
  );
  assert.equal(cardReadings.length, 5);
});

test('Selective Historical Yotsugana Grafting from Wiktionary {{ja-readings}}', () => {
  const juPairs = parseWiktionaryJaReadings('{{ja-readings|goon=じゅう<ぢゆう|kanon=ちょう}}');
  const juResolved = resolveKanjiReadingYotsugana('重', 'ジュウ', juPairs);
  assert.equal(juResolved, 'ぢゅう');
  assert.equal(kanaToCustomRomaji(juResolved), 'djuu');

  const joPairs = parseWiktionaryJaReadings('{{ja-readings|goon=じょう<ぢやう|kanon=ちょう<ちやう|kun=ば-}}');
  const joResolved = resolveKanjiReadingYotsugana('場', 'ジョウ', joPairs);
  assert.equal(joResolved, 'ぢょう');
  assert.equal(kanaToCustomRomaji(joResolved), 'djou');

  const dePairs = parseWiktionaryJaReadings('{{ja-readings|goon=じょう<でう|kanon=ちょう<てう}}');
  assert.equal(kanaToCustomRomaji(resolveKanjiReadingYotsugana('條', 'ジョウ', dePairs)), 'djou');

  const tenPairs = parseWiktionaryJaReadings('{{ja-readings|goon=じゅう<じふ|kanon=しゅう<しふ}}');
  const tenResolved = resolveKanjiReadingYotsugana('十', 'ジュウ', tenPairs);
  assert.equal(tenResolved, 'じゅう');
  assert.equal(kanaToCustomRomaji(tenResolved), 'juu');

  const hajiPairs = parseWiktionaryJaReadings('{{ja-readings|goon=ち|kanon=ち|kun=はじ-<はぢ-, は-じる<は-ぢる, は-ずかし.い<は-づかし.い}}');
  const hajiResolved = resolveKanjiReadingYotsugana('恥', 'はじ.る', hajiPairs);
  const parsedHaji = parseKanjiReading('はじ.る', hajiResolved, 'kun');
  assert.equal(parsedHaji.rootRomaji, 'hadji');
  assert.equal(parsedHaji.okuriganaRomaji, 'ru');

  const zuPairs = parseWiktionaryJaReadings('{{ja-readings|goon=ず<づ|kanon=と<と}}');
  assert.equal(kanaToCustomRomaji(resolveKanjiReadingYotsugana('図', 'ズ', zuPairs)), 'dzu');
});

test('Seeded PRNG shuffle is deterministic and reversible', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const a = seededShuffle(input, 'sakura-2026', false);
  const b = seededShuffle(input, 'sakura-2026', false);
  const c = seededShuffle(input, 'sakura-2026', true);
  assert.deepEqual(a, b);
  assert.deepEqual(a, [...c].reverse());
});

test('Middle Zone layout is 2x reading font size, vertically centered for 1 line, and splits to 2 lines before shrinking', () => {
  assert.equal(BASE_DEFINITION_FONT_SIZE, BASE_READING_FONT_SIZE * 2);

  const oneLine = computeMiddleZoneLayout('flower');
  assert.equal(oneLine.length, 1);
  assert.equal(oneLine[0].y, 88);
  assert.equal(oneLine[0].fontSize, 17);
  assert.equal(oneLine[0].shouldSqueeze, false);

  const twoLines = computeMiddleZoneLayout('signature/govt office/police station');
  assert.equal(twoLines.length, 2);
  assert.equal(twoLines[0].y, 78);
  assert.equal(twoLines[1].y, 95);
  assert.equal(twoLines[0].text + twoLines[1].text, 'signature/govt office/police station');
});

test('Kanji definition fallback prevents repeating kanji glyph (e.g. 署 / 署) in middleText', () => {
  const radMap = new Map([[122, { num: 122, glyph: '网', strokes: 6, ja: 'あみがしら', en: 'net' }]]);
  const nfcLookup = new Map([
    [
      '署',
      {
        c: '署',
        s: 13,
        g: 6,
        f: 725,
        j: 1,
        r: 122,
        m: ['signature', 'govt office', 'police station'],
        on: ['しょ'],
        kun: [],
      },
    ],
  ]);

  const item = buildKanjiCharacterItem(
    { c: '\uFA5A', s: 14, g: 9, f: null, j: 0, r: 122, m: [], on: [], kun: [] },
    radMap,
    0,
    undefined,
    nfcLookup
  );
  assert.equal(item.middleText, 'signature/govt office/police station');
  assert.notEqual(item.middleText, '\uFA5A');

  const wikGlosses = extractWiktionaryMeanings('# [[government]] [[office]]; [[police station]]');
  assert.deepEqual(wikGlosses, ['government office']);
});
