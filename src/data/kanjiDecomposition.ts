/**
 * Synchronic Visual 3-Operator CJK Structural Decomposition Engine
 *
 * Decomposes CJK characters into right-associative binary prefix-notation formulas
 * using strictly three structural operators:
 *  - ⿰ (Horizontal): Left + Right
 *  - ⿱ (Vertical): Top + Bottom
 *  - ⿴ (Containment / Intersection): Outer Frame / Base + Inner / Intersecting Element
 *
 * All leaves resolve strictly to the 134 Visually Indivisible Base Kanji Units below
 * (within the 115–135 base unit specification), obeying:
 *  - No-Unpiercing Gestalt Rule (東, 西, 中, 用, 舟, 羊, 事, 母 stay indivisible)
 *  - No-Orphan Rule (言 stays whole; 𧘇 acts as standalone bottom of 衣 variants)
 *  - Pure-Visual Identity & Allographs (月 in 明/肚/服 -> 月; left/right 阝/⻏ merge; 片 != 爿)
 *  - Clean Visual Splits (糸=⿱幺小, 足=⿱口龰, 果=⿱田木, 音=⿱立日, 肉=⿴冂⿱人人, 主=⿱丶王)
 *  - Canonical Edge-Case Formulas (申=⿴丨田, 由=⿱丨田, 甲=⿱田丨, 本=⿱木一, 末=⿴木一, 未=⿴木十, 曰=⿴口一, 平=⿱丷干, 半=⿴丰丷)
 */

import { PACKED_KANJI_FORMULAS } from './kanjiDecompositionData';

export type VisualOperator = '⿰' | '⿱' | '⿴';

export interface OperatorMeta {
  op: VisualOperator;
  name: string;
  orderHint: string;
}

export const DECOMPOSITION_OPERATORS: Record<VisualOperator, OperatorMeta> = {
  '⿰': {
    op: '⿰',
    name: 'Horizontal',
    orderHint: 'Left + Right',
  },
  '⿱': {
    op: '⿱',
    name: 'Vertical',
    orderHint: 'Top + Bottom',
  },
  '⿴': {
    op: '⿴',
    name: 'Containment / Intersection',
    orderHint: 'Outer Frame / Base + Inner / Piercing',
  },
};

export interface VisualBaseUnit {
  canonical: string;
  allographs: readonly string[];
  labelEn: string;
}

export const VISUAL_BASE_UNITS: readonly VisualBaseUnit[] = [
  // 1. Strokes & Geometric Primitives (13)
  { canonical: '一', allographs: ['㇀'], labelEn: 'horizontal bar' },
  { canonical: '丨', allographs: ['亅'], labelEn: 'vertical bar' },
  { canonical: '丶', allographs: [], labelEn: 'dot' },
  { canonical: '丿', allographs: ['乀', '乁', '𠂆', '𠂎'], labelEn: 'slash' },
  {
    canonical: '乙',
    allographs: ['乚', '乛', '⺄', '𠃌', '𠃊', '㇉', '𠃑', '𠄌', '𠃜', '𡿨'],
    labelEn: 'bend / hook',
  },
  { canonical: '亠', allographs: [], labelEn: 'lid' },
  { canonical: '十', allographs: [], labelEn: 'ten / cross' },
  { canonical: '乂', allographs: ['㐅'], labelEn: 'crossed strokes' },
  { canonical: '匕', allographs: [], labelEn: 'spoon' },
  { canonical: '厂', allographs: ['⺁'], labelEn: 'cliff' },
  { canonical: '厶', allographs: ['マ', '龴'], labelEn: 'elbow / private' },
  { canonical: '卜', allographs: ['⺊'], labelEn: 'divination' },
  { canonical: '工', allographs: [], labelEn: 'craft' },

  // 2. Frames & Enclosures (12)
  { canonical: '冂', allographs: ['⺆'], labelEn: 'down-box' },
  { canonical: '冖', allographs: [], labelEn: 'cover' },
  { canonical: '宀', allographs: [], labelEn: 'roof' },
  { canonical: '凵', allographs: [], labelEn: 'open container' },
  { canonical: '匚', allographs: ['匸', 'コ'], labelEn: 'side-box' },
  { canonical: '囗', allographs: [], labelEn: 'enclosure' },
  { canonical: '勹', allographs: ['𠂊'], labelEn: 'wrap' },
  { canonical: '几', allographs: ['⺇'], labelEn: 'wind / table frame' },
  { canonical: '广', allographs: [], labelEn: 'dotted cliff' },
  { canonical: '疒', allographs: [], labelEn: 'sickness frame' },
  { canonical: '尸', allographs: [], labelEn: 'flag / body frame' },
  { canonical: '戸', allographs: ['戶', '户'], labelEn: 'door' },

  // 3. Human, Hand, Foot & Motion (17)
  { canonical: '人', allographs: ['亻', '𠂉'], labelEn: 'person' },
  { canonical: '入', allographs: [], labelEn: 'enter' },
  { canonical: '儿', allographs: [], labelEn: 'legs' },
  { canonical: '八', allographs: ['丷', 'ソ'], labelEn: 'eight / twin dots' },
  { canonical: '又', allographs: ['⺕', '彐', '彑', 'ヨ', 'ユ'], labelEn: 'right hand / snout' },
  { canonical: '力', allographs: [], labelEn: 'power' },
  { canonical: '卩', allographs: ['㔾'], labelEn: 'seal / kneel' },
  { canonical: '手', allographs: ['扌', '龵'], labelEn: 'hand' },
  { canonical: '爪', allographs: ['爫'], labelEn: 'claw' },
  { canonical: '攴', allographs: ['攵'], labelEn: 'strike' },
  { canonical: '殳', allographs: [], labelEn: 'weapon' },
  { canonical: '止', allographs: [], labelEn: 'stop' },
  { canonical: '龰', allographs: ['疋', '⻊'], labelEn: 'foot-base' },
  { canonical: '辵', allographs: ['辶', '⻌', '廴'], labelEn: 'walk / stride' },
  { canonical: '女', allographs: [], labelEn: 'woman' },
  { canonical: '子', allographs: ['孑', '孓'], labelEn: 'child' },
  { canonical: '大', allographs: [], labelEn: 'big' },

  // 4. Body, Speech & Garment (11)
  { canonical: '口', allographs: [], labelEn: 'mouth / small box' },
  { canonical: '目', allographs: ['罒', '网'], labelEn: 'eye / net' },
  { canonical: '耳', allographs: [], labelEn: 'ear' },
  { canonical: '臣', allographs: [], labelEn: 'minister' },
  { canonical: '牙', allographs: [], labelEn: 'fang' },
  { canonical: '心', allographs: ['忄', '㣺'], labelEn: 'heart' },
  { canonical: '言', allographs: ['訁'], labelEn: 'speech' },
  { canonical: '身', allographs: [], labelEn: 'body' },
  { canonical: '毛', allographs: [], labelEn: 'fur / hair' },
  { canonical: '𧘇', allographs: ['衤'], labelEn: 'garment / robe-bottom' },
  { canonical: '門', allographs: ['门'], labelEn: 'gate' },

  // 5. Nature, Elements & Plants (17)
  { canonical: '日', allographs: [], labelEn: 'sun / day' },
  { canonical: '月', allographs: ['⺼'], labelEn: 'moon / flesh-allograph' },
  { canonical: '火', allographs: ['灬'], labelEn: 'fire' },
  { canonical: '水', allographs: ['氵', '氺'], labelEn: 'water' },
  { canonical: '土', allographs: [], labelEn: 'earth' },
  { canonical: '山', allographs: ['屮'], labelEn: 'mountain / sprout' },
  { canonical: '巛', allographs: [], labelEn: 'curving river' },
  { canonical: '雨', allographs: ['⻗'], labelEn: 'rain' },
  { canonical: '气', allographs: [], labelEn: 'steam' },
  { canonical: '田', allographs: [], labelEn: 'field' },
  { canonical: '木', allographs: ['朩'], labelEn: 'tree' },
  { canonical: '禾', allographs: [], labelEn: 'grain' },
  { canonical: '米', allographs: [], labelEn: 'rice' },
  { canonical: '竹', allographs: ['⺮'], labelEn: 'bamboo' },
  { canonical: '艸', allographs: ['艹', '䒑'], labelEn: 'grass' },
  { canonical: '瓜', allographs: [], labelEn: 'melon' },
  { canonical: '夕', allographs: [], labelEn: 'evening' },

  // 6. Animals (13)
  { canonical: '犬', allographs: ['犭'], labelEn: 'dog / beast' },
  { canonical: '牛', allographs: ['牜', '⺧'], labelEn: 'cow' },
  { canonical: '羊', allographs: ['⺶', '⺷'], labelEn: 'sheep' },
  { canonical: '馬', allographs: [], labelEn: 'horse' },
  { canonical: '豕', allographs: [], labelEn: 'pig' },
  { canonical: '豸', allographs: [], labelEn: 'badger' },
  { canonical: '虍', allographs: [], labelEn: 'tiger' },
  { canonical: '虫', allographs: [], labelEn: 'insect' },
  { canonical: '鳥', allographs: [], labelEn: 'bird' },
  { canonical: '隹', allographs: [], labelEn: 'short-tailed bird' },
  { canonical: '魚', allographs: [], labelEn: 'fish' },
  { canonical: '亀', allographs: ['龜'], labelEn: 'turtle' },
  { canonical: '龍', allographs: ['竜'], labelEn: 'dragon' },

  // 7. Gestalt / Pierced / Cultural Indivisible Bases (51) -> Total = 134 Base Units
  { canonical: '干', allographs: [], labelEn: 'shield / dry' },
  { canonical: '小', allographs: ['⺌', '⺍'], labelEn: 'small' },
  { canonical: '尢', allographs: ['尣'], labelEn: 'lame' },
  { canonical: '巾', allographs: [], labelEn: 'cloth' },
  { canonical: '幺', allographs: ['糹', '乡'], labelEn: 'short thread' },
  { canonical: '弓', allographs: [], labelEn: 'bow' },
  { canonical: '弋', allographs: [], labelEn: 'shoot' },
  { canonical: '戈', allographs: [], labelEn: 'halberd' },
  { canonical: '斤', allographs: [], labelEn: 'axe' },
  { canonical: '斗', allographs: [], labelEn: 'dipper' },
  { canonical: '歹', allographs: ['歺'], labelEn: 'bare bone' },
  { canonical: '毋', allographs: ['母', '⺟', '毌'], labelEn: 'mother' },
  { canonical: '氏', allographs: [], labelEn: 'clan' },
  { canonical: '片', allographs: [], labelEn: 'slice (right)' },
  { canonical: '爿', allographs: ['丬'], labelEn: 'split wood (left)' },
  { canonical: '王', allographs: ['龶'], labelEn: 'king / jade-stem' },
  { canonical: '瓦', allographs: [], labelEn: 'tile' },
  { canonical: '甘', allographs: [], labelEn: 'sweet' },
  { canonical: '生', allographs: [], labelEn: 'life' },
  { canonical: '用', allographs: [], labelEn: 'use' },
  { canonical: '皿', allographs: [], labelEn: 'dish' },
  { canonical: '矢', allographs: [], labelEn: 'arrow' },
  { canonical: '立', allographs: [], labelEn: 'stand' },
  { canonical: '而', allographs: [], labelEn: 'beard' },
  { canonical: '聿', allographs: ['⺻'], labelEn: 'brush' },
  { canonical: '臼', allographs: ['𦥑'], labelEn: 'mortar' },
  { canonical: '舟', allographs: [], labelEn: 'boat' },
  { canonical: '艮', allographs: [], labelEn: 'stopping' },
  { canonical: '巴', allographs: [], labelEn: 'crest' },
  { canonical: '車', allographs: [], labelEn: 'cart' },
  { canonical: '辰', allographs: [], labelEn: 'dragon-sign' },
  { canonical: '阝', allographs: ['⻏'], labelEn: 'mound / town' },
  { canonical: '酉', allographs: [], labelEn: 'wine' },
  { canonical: '金', allographs: ['釒'], labelEn: 'metal' },
  { canonical: '長', allographs: ['镸'], labelEn: 'long' },
  { canonical: '非', allographs: [], labelEn: 'wings / wrong' },
  { canonical: '韋', allographs: [], labelEn: 'tanned leather' },
  { canonical: '食', allographs: ['飠', '𩙿'], labelEn: 'food' },
  { canonical: '鬼', allographs: [], labelEn: 'demon' },
  { canonical: '東', allographs: [], labelEn: 'east' },
  { canonical: '西', allographs: ['襾', '覀'], labelEn: 'west' },
  { canonical: '中', allographs: [], labelEn: 'middle' },
  { canonical: '事', allographs: [], labelEn: 'matter' },
  { canonical: '丰', allographs: [], labelEn: 'abundant' },
  { canonical: '曲', allographs: [], labelEn: 'bent' },
  { canonical: '冊', allographs: ['册'], labelEn: 'booklet' },
  { canonical: '己', allographs: ['巳', '已'], labelEn: 'oneself' },
  { canonical: '示', allographs: ['礻'], labelEn: 'altar' },
  { canonical: '黽', allographs: [], labelEn: 'frog' },
  { canonical: '民', allographs: [], labelEn: 'people' },
  { canonical: '凹', allographs: ['凸'], labelEn: 'concave / convex' },
] as const;

const GLYPH_TO_BASE_UNIT = new Map<string, VisualBaseUnit>();
for (const unit of VISUAL_BASE_UNITS) {
  GLYPH_TO_BASE_UNIT.set(unit.canonical, unit);
  for (const allo of unit.allographs) {
    GLYPH_TO_BASE_UNIT.set(allo, unit);
  }
}

const KANJI_FORMULA_MAP = new Map<string, string>();
for (const entry of PACKED_KANJI_FORMULAS.split('|')) {
  if (!entry) continue;
  const colonIdx = entry.indexOf(':');
  if (colonIdx === -1) {
    KANJI_FORMULA_MAP.set(entry, entry);
  } else {
    KANJI_FORMULA_MAP.set(entry.slice(0, colonIdx), entry.slice(colonIdx + 1));
  }
}

export function isVisualOperator(ch: string): ch is VisualOperator {
  return ch === '⿰' || ch === '⿱' || ch === '⿴';
}

export function lookupVisualBaseUnit(glyph: string): VisualBaseUnit | undefined {
  return GLYPH_TO_BASE_UNIT.get(glyph);
}

export type VisualDecompAstNode =
  | {
      type: 'leaf';
      glyph: string;
      canonicalBase: string;
      labelEn: string;
    }
  | {
      type: 'op';
      op: VisualOperator;
      left: VisualDecompAstNode;
      right: VisualDecompAstNode;
    };

export function parseVisualDecompositionAst(formula: string): VisualDecompAstNode {
  const tokens = [...formula].filter((c) => !/\s/.test(c));
  if (tokens.length === 0) {
    throw new Error('Empty decomposition formula');
  }
  const pos = { i: 0 };

  const parseNode = (): VisualDecompAstNode => {
    if (pos.i >= tokens.length) {
      throw new Error(`Truncated prefix formula: "${formula}"`);
    }
    const tok = tokens[pos.i++];
    if (isVisualOperator(tok)) {
      const left = parseNode();
      const right = parseNode();
      return { type: 'op', op: tok, left, right };
    }
    const unit = GLYPH_TO_BASE_UNIT.get(tok);
    return {
      type: 'leaf',
      glyph: tok,
      canonicalBase: unit?.canonical ?? tok,
      labelEn: unit?.labelEn ?? 'base unit',
    };
  };

  const root = parseNode();
  if (pos.i !== tokens.length) {
    throw new Error(
      `Unconsumed trailing tokens in formula "${formula}" at index ${pos.i}`
    );
  }
  return root;
}

export interface KanjiVisualDecomposition {
  char: string;
  formula: string;
  ast: VisualDecompAstNode;
  baseComponents: Array<{
    glyph: string;
    canonicalBase: string;
    labelEn: string;
  }>;
  operatorsUsed: VisualOperator[];
  operatorCount: number;
  isIndivisibleBase: boolean;
}

export function getKanjiVisualDecomposition(
  char: string
): KanjiVisualDecomposition {
  const formula =
    KANJI_FORMULA_MAP.get(char) ??
    KANJI_FORMULA_MAP.get(char.normalize('NFC')) ??
    char;

  const ast = parseVisualDecompositionAst(formula);
  const baseComponents: Array<{
    glyph: string;
    canonicalBase: string;
    labelEn: string;
  }> = [];
  const seenBaseKeys = new Set<string>();
  const opsSet = new Set<VisualOperator>();
  let operatorCount = 0;

  const walk = (node: VisualDecompAstNode) => {
    if (node.type === 'op') {
      operatorCount++;
      opsSet.add(node.op);
      walk(node.left);
      walk(node.right);
    } else {
      const key = `${node.glyph}:${node.canonicalBase}`;
      if (!seenBaseKeys.has(key)) {
        seenBaseKeys.add(key);
        baseComponents.push({
          glyph: node.glyph,
          canonicalBase: node.canonicalBase,
          labelEn: node.labelEn,
        });
      }
    }
  };
  walk(ast);

  return {
    char,
    formula,
    ast,
    baseComponents,
    operatorsUsed: [...opsSet],
    operatorCount,
    isIndivisibleBase: operatorCount === 0,
  };
}
