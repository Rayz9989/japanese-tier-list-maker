import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ALL_KANJI_GROUP_IDS,
  classifyKanjiGroup,
  HYOGAI_TABOO_SET,
  isQualifyingHyogaiKanji,
  JIS_LEVEL_1_SET,
  KANKEN_3_SET,
  KANKEN_4_SET,
  KANKEN_PRE1_SET,
  KANKEN_PRE2_SET,
  TABOO_ATTESTED_NAME_KANJI,
  TABOO_UNATTESTED_NON_NAME_KANJI,
} from './kanjiClassification';
import {
  getKanjiVisualDecomposition,
  isVisualOperator,
  lookupVisualBaseUnit,
  VISUAL_BASE_UNITS,
} from './kanjiDecomposition';
import { buildKanjiCharacterItem, RawSeedKanji } from '../services/dataLoader';
import { buildBuiltinKanaAndSymbols } from './kanaAndSymbols';
import {
  applyPresetToFilterState,
  createDefaultFilterState,
  filterAndSortCharacters,
  partitionPoolByClassificationTier,
} from '../utils/filterAndSort';
import { KangxiRadical } from '../types/characters';

const seedPath = path.resolve(process.cwd(), 'public/kanji-seed.json');
const seedPayload = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as {
  radicals: KangxiRadical[];
  kanji: RawSeedKanji[];
};

test('JIS X 0208 Level 1 runtime generator produces exact 2,965 single kanji', () => {
  assert.equal(JIS_LEVEL_1_SET.size, 2965);
  assert.equal(JIS_LEVEL_1_SET.has('亜'), true); // ku 16, ten 1
  assert.equal(JIS_LEVEL_1_SET.has('腕'), true); // ku 47, ten 51
  for (const ch of JIS_LEVEL_1_SET) {
    assert.equal([...ch].length, 1, `Expected single codepoint, got ${ch}`);
  }
});

test('Kanken 4, 3, Pre-2, and Pre-1 sets are single-char, disjoint, and Pre-1 excludes Jōyō', () => {
  assert.equal(KANKEN_4_SET.size, 313);
  assert.equal(KANKEN_3_SET.size, 284);
  assert.equal(KANKEN_PRE2_SET.size, 328);
  assert.equal(KANKEN_PRE1_SET.size, 940);

  const joyoChars = new Set(
    seedPayload.kanji.filter((k) => k.j === 1).map((k) => k.c)
  );

  for (const ch of KANKEN_4_SET) {
    assert.equal([...ch].length, 1);
    assert.equal(KANKEN_3_SET.has(ch), false);
    assert.equal(KANKEN_PRE2_SET.has(ch), false);
  }
  for (const ch of KANKEN_3_SET) {
    assert.equal([...ch].length, 1);
    assert.equal(KANKEN_PRE2_SET.has(ch), false);
  }
  for (const ch of KANKEN_PRE1_SET) {
    assert.equal([...ch].length, 1);
    assert.equal(
      joyoChars.has(ch),
      false,
      `Jōyō character ${ch} must not appear in KANKEN_PRE1_SET`
    );
  }
});

test('Taboo Override Sets strictly obey legal set membership and exclude 霊', () => {
  const joyoAndJinmeiyo = new Set(
    seedPayload.kanji.filter((k) => k.j === 1 || k.j === 0).map((k) => k.c)
  );

  assert.equal(TABOO_ATTESTED_NAME_KANJI.has('霊'), false);
  assert.equal(TABOO_UNATTESTED_NON_NAME_KANJI.has('霊'), false);
  assert.equal(HYOGAI_TABOO_SET.has('霊'), false);

  // Hyōgai animals (鼠, 狐, 狸) must NOT be in Groups 15/16
  for (const hyoAnimal of ['鼠', '狐', '狸']) {
    assert.equal(TABOO_ATTESTED_NAME_KANJI.has(hyoAnimal), false);
    assert.equal(TABOO_UNATTESTED_NON_NAME_KANJI.has(hyoAnimal), false);
    assert.equal(HYOGAI_TABOO_SET.has(hyoAnimal), true);
  }

  // 罵 is Jōyō -> Group 16, not HYOGAI_TABOO_SET
  assert.equal(TABOO_UNATTESTED_NON_NAME_KANJI.has('罵'), true);
  assert.equal(HYOGAI_TABOO_SET.has('罵'), false);

  for (const ch of TABOO_ATTESTED_NAME_KANJI) {
    assert.equal(
      joyoAndJinmeiyo.has(ch),
      true,
      `Group 15 char ${ch} must be Jōyō or Jinmeiyō`
    );
    assert.equal(TABOO_UNATTESTED_NON_NAME_KANJI.has(ch), false);
  }

  for (const ch of TABOO_UNATTESTED_NON_NAME_KANJI) {
    assert.equal(
      joyoAndJinmeiyo.has(ch),
      true,
      `Group 16 char ${ch} must be Jōyō or Jinmeiyō`
    );
  }

  for (const ch of HYOGAI_TABOO_SET) {
    assert.equal(
      joyoAndJinmeiyo.has(ch),
      false,
      `HYOGAI_TABOO_SET char ${ch} must not be Jōyō or Jinmeiyō`
    );
  }
});

test('19-tier waterfall classifies all 3,448 kanji into non-empty mutually exclusive groups', () => {
  const radMap = new Map<number, KangxiRadical>(
    seedPayload.radicals.map((r) => [r.num, r])
  );
  const radGlyphSet = new Set<string>(
    seedPayload.radicals.flatMap((r) => [r.glyph, r.glyph.normalize('NFKC')])
  );

  assert.ok(
    seedPayload.kanji.length >= 3440 && seedPayload.kanji.length <= 3650,
    `Expected ~3,450–3,650 total kanji, got ${seedPayload.kanji.length}`
  );

  const counts = new Map<number, number>();
  for (let idx = 0; idx < seedPayload.kanji.length; idx++) {
    const raw = seedPayload.kanji[idx];
    if (raw.j === 2) {
      assert.equal(
        isQualifyingHyogaiKanji(raw.c, Boolean(raw.rb || radGlyphSet.has(raw.c))),
        true,
        `Hyōgai ${raw.c} must satisfy at least one of the 3 inclusion criteria`
      );
    }
    const item = buildKanjiCharacterItem(raw, radMap, idx);
    assert.ok(item.kanjiGroup && item.kanjiGroup >= 1 && item.kanjiGroup <= 19);
    counts.set(item.kanjiGroup, (counts.get(item.kanjiGroup) ?? 0) + 1);
  }

  for (const gId of ALL_KANJI_GROUP_IDS) {
    assert.ok(
      (counts.get(gId) ?? 0) > 0,
      `Expected Kanji Group ${gId} to have >0 characters`
    );
  }

  // Spot-check key waterfall assignments
  assert.equal(
    classifyKanjiGroup({ char: '一', category: 'joyo_kanji', grade: 1 }),
    1
  );
  assert.equal(
    classifyKanjiGroup({ char: '霊', category: 'joyo_kanji', grade: 8 }),
    8
  );
  assert.equal(
    classifyKanjiGroup({ char: '死', category: 'joyo_kanji', grade: 3 }),
    15
  );
  assert.equal(
    classifyKanjiGroup({ char: '鬱', category: 'joyo_kanji', grade: 8 }),
    16
  );
  assert.equal(
    classifyKanjiGroup({ char: '嬉', category: 'jinmeiyo_kanji', grade: 9, jlpt: 1 }),
    11
  );
  assert.equal(
    classifyKanjiGroup({ char: '癌', category: 'hyogai_kanji', grade: null }),
    19
  );
  assert.equal(
    classifyKanjiGroup({ char: '飴', category: 'hyogai_kanji', grade: null }),
    17
  );
});

test('School order sort & Group by Tier collation strictly follow 1 -> 19 progression', () => {
  const radMap = new Map<number, KangxiRadical>(
    seedPayload.radicals.map((r) => [r.num, r])
  );
  const kanjiItems = seedPayload.kanji.map((k, idx) =>
    buildKanjiCharacterItem(k, radMap, idx)
  );
  const kanaItems = buildBuiltinKanaAndSymbols(kanjiItems.length);
  const allItems = [...kanjiItems, ...kanaItems];

  const schoolSorted = filterAndSortCharacters(
    allItems,
    new Set(),
    new Set(),
    createDefaultFilterState(),
    'school_order',
    false,
    'test-seed'
  );

  let prevGroup = 1;
  for (const it of schoolSorted) {
    const rank = it.kanjiGroup ?? 20;
    assert.ok(
      rank >= prevGroup,
      `School order regressed from ${prevGroup} to ${rank} on ${it.char}`
    );
    prevGroup = rank;
  }

  // Group-by-Tier with seeded random sort keeps sections ordered 1..19+ while randomizing inside each group
  const randomSorted = filterAndSortCharacters(
    allItems,
    new Set(),
    new Set(),
    createDefaultFilterState(),
    'random',
    false,
    'sakura-2026'
  );
  const sections = partitionPoolByClassificationTier(randomSorted);
  assert.equal(sections.length, 23); // 19 kanji groups + hiragana + katakana + ligatures + symbols
  for (let i = 1; i < sections.length; i++) {
    assert.ok(sections[i].orderIndex > sections[i - 1].orderIndex);
  }

  // Preset check: taboo_overrides returns strictly Groups 15 & 16
  const tabooFilters = applyPresetToFilterState(
    createDefaultFilterState(),
    'taboo_overrides'
  );
  const tabooItems = filterAndSortCharacters(
    allItems,
    new Set(),
    new Set(),
    tabooFilters,
    'school_order',
    false,
    'seed'
  );
  assert.ok(tabooItems.length > 100);
  assert.ok(
    tabooItems.every((x) => x.kanjiGroup === 15 || x.kanjiGroup === 16)
  );
});

test('Synchronic 3-Operator CJK Visual Decomposition obeys base count, canonical formulas, and AST validity', () => {
  assert.ok(
    VISUAL_BASE_UNITS.length >= 115 && VISUAL_BASE_UNITS.length <= 135,
    `Base units (${VISUAL_BASE_UNITS.length}) must be within 115–135`
  );

  // Mirror-image shapes stay separate
  assert.notEqual(
    lookupVisualBaseUnit('片')?.canonical,
    lookupVisualBaseUnit('爿')?.canonical
  );

  // Indivisible Gestalt bases
  for (const gestalt of ['東', '西', '中', '用', '舟', '羊', '事', '母', '言', '田']) {
    const d = getKanjiVisualDecomposition(gestalt);
    assert.equal(d.formula, gestalt);
    assert.equal(d.isIndivisibleBase, true);
  }

  // Clean Visual Splits
  assert.equal(getKanjiVisualDecomposition('糸').formula, '⿱幺小');
  assert.equal(getKanjiVisualDecomposition('足').formula, '⿱口龰');
  assert.equal(getKanjiVisualDecomposition('果').formula, '⿱田木');
  assert.equal(getKanjiVisualDecomposition('音').formula, '⿱立日');
  assert.equal(getKanjiVisualDecomposition('肉').formula, '⿴冂⿱人人');
  assert.equal(getKanjiVisualDecomposition('主').formula, '⿱丶王');
  assert.equal(getKanjiVisualDecomposition('衣').formula, '⿱亠𧘇');

  // Pure-Visual Identity across 明 / 肚 / 服
  for (const ch of ['明', '肚', '服']) {
    const d = getKanjiVisualDecomposition(ch);
    assert.equal(
      d.baseComponents.some((b) => b.canonicalBase === '月'),
      true,
      `Expected ${ch} (${d.formula}) to contain visual 月`
    );
  }

  // Canonical Edge-Case Formulas
  assert.equal(getKanjiVisualDecomposition('申').formula, '⿴丨田');
  assert.equal(getKanjiVisualDecomposition('由').formula, '⿱丨田');
  assert.equal(getKanjiVisualDecomposition('甲').formula, '⿱田丨');
  assert.equal(getKanjiVisualDecomposition('本').formula, '⿱木一');
  assert.equal(getKanjiVisualDecomposition('末').formula, '⿴木一');
  assert.equal(getKanjiVisualDecomposition('未').formula, '⿴木十');
  assert.equal(getKanjiVisualDecomposition('曰').formula, '⿴口一');
  assert.equal(getKanjiVisualDecomposition('平').formula, '⿱丷干');
  assert.equal(getKanjiVisualDecomposition('半').formula, '⿴丰丷');

  // Exhaustive check across all 3,448 kanji in kanji-seed.json
  for (const k of seedPayload.kanji) {
    const d = getKanjiVisualDecomposition(k.c);
    assert.ok(d.formula.length >= 1);
    for (const tok of [...d.formula]) {
      if (!isVisualOperator(tok)) {
        assert.ok(
          lookupVisualBaseUnit(tok) !== undefined,
          `Kanji ${k.c} formula "${d.formula}" contains unregistered leaf "${tok}"`
        );
      }
    }
  }
});
