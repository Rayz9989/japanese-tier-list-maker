/**
 * Pure SVG text layout calculator for the 3-zone Character Card (viewBox="0 0 120 120").
 * Ensures the Middle Zone (definition/translation) is 2x the base reading font size (17 vs 8.5),
 * can occupy up to 2 lines before shrinking, is vertically centered when 1 line,
 * and never shifts the Top Zone character glyph position.
 */

export const BASE_READING_FONT_SIZE = 8.5;
export const BASE_DEFINITION_FONT_SIZE = 17.0; // 2x the size of the readings
export const MAX_SVG_TEXT_WIDTH = 110;

export interface SvgLineMetric {
  text: string;
  y: number;
  fontSize: number;
  shouldSqueeze: boolean;
}

/**
 * Estimate SVG advance width in viewBox="0 0 120 120" units for Andika / Noto Sans JP.
 */
export function estimateSvgTextWidth(
  text: string,
  fontSize: number,
  isBold = false,
  isKanaScript = false
): number {
  if (!text) return 0;
  const weightFactor = isBold ? 1.07 : 1.0;
  let total = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === '/' || ch === 'i' || ch === 'l' || ch === 'j' || ch === "'" || ch === 't' || ch === 'I') {
      total += fontSize * 0.36 * weightFactor;
    } else if (ch === ' ') {
      total += fontSize * 0.30 * weightFactor;
    } else if (ch === 'm' || ch === 'w' || ch === 'M' || ch === 'W') {
      total += fontSize * 0.78 * weightFactor;
    } else if (isKanaScript || code > 0x2e80) {
      total += fontSize * 0.96 * weightFactor;
    } else {
      total += fontSize * 0.56 * weightFactor;
    }
  }
  return total;
}

/**
 * Split a definition string into [line1, line2] at the '/' or ' ' closest to the visual midpoint.
 */
export function splitIntoTwoBalancedLines(text: string): [string, string] | [string] {
  const trimmed = text.trim();
  if (!trimmed) return [''];

  // Find candidate split indices (after '/' or at ' ')
  const splitCandidates: Array<{ index: number; left: string; right: string }> = [];
  for (let i = 1; i < trimmed.length - 1; i++) {
    if (trimmed[i] === '/') {
      // Keep '/' at the end of line 1 so meaning boundary remains explicit
      const left = trimmed.slice(0, i + 1).trim();
      const right = trimmed.slice(i + 1).trim();
      if (left && right) {
        splitCandidates.push({ index: i, left, right });
      }
    } else if (trimmed[i] === ' ') {
      const left = trimmed.slice(0, i).trim();
      const right = trimmed.slice(i + 1).trim();
      if (left && right) {
        splitCandidates.push({ index: i, left, right });
      }
    }
  }

  if (splitCandidates.length === 0) {
    // Single unbroken token (e.g. a single word) — keep on 1 line and squeeze if needed
    return [trimmed];
  }

  const mid = trimmed.length / 2;
  // Prefer '/' splits first if reasonably balanced, otherwise any split closest to midpoint
  const slashCandidates = splitCandidates.filter((c) => c.left.endsWith('/'));
  const pool = slashCandidates.length > 0 ? slashCandidates : splitCandidates;

  let best = pool[0];
  let bestScore = Math.abs(best.index - mid) + Math.abs(best.left.length - best.right.length) * 0.5;

  for (const cand of pool) {
    const score = Math.abs(cand.index - mid) + Math.abs(cand.left.length - cand.right.length) * 0.5;
    if (score < bestScore) {
      best = cand;
      bestScore = score;
    }
  }

  return [best.left, best.right];
}

/**
 * Compute Middle Zone (y=63 to y=101, vertical center y=82) line layout:
 * - Base font size = 17.0 (2x the 8.5 reading font size)
 * - If 1 line fits within 110 SVG units (or has no break points), renders 1 line centered at y=88
 * - Otherwise splits into 2 lines at y=78 and y=95 before shrinking
 */
export function computeMiddleZoneLayout(text: string): SvgLineMetric[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const singleLineWidthAtBase = estimateSvgTextWidth(
    trimmed,
    BASE_DEFINITION_FONT_SIZE,
    true,
    false
  );

  // Fits on 1 line at full 2x size (17px)
  if (singleLineWidthAtBase <= MAX_SVG_TEXT_WIDTH) {
    return [
      {
        text: trimmed,
        y: 88, // Vertically centered in Middle Zone (y=63..101)
        fontSize: BASE_DEFINITION_FONT_SIZE,
        shouldSqueeze: false,
      },
    ];
  }

  const split = splitIntoTwoBalancedLines(trimmed);
  if (split.length === 1) {
    // Unbroken single word that exceeds 110 units at 17px: step down gently on 1 centered line
    const w15 = estimateSvgTextWidth(trimmed, 15.0, true, false);
    const fontSize = w15 <= MAX_SVG_TEXT_WIDTH ? 15.0 : 13.5;
    const finalW = estimateSvgTextWidth(trimmed, fontSize, true, false);
    return [
      {
        text: trimmed,
        y: 87.5,
        fontSize,
        shouldSqueeze: finalW > MAX_SVG_TEXT_WIDTH,
      },
    ];
  }

  const [line1, line2] = split;

  // Determine the largest fontSize (starting from 17.0 = 2x readings) that fits both lines cleanly before squeezing
  let fontSize = BASE_DEFINITION_FONT_SIZE;
  const maxChars = Math.max(line1.length, line2.length);
  if (maxChars > 20) fontSize = 12.5;
  else if (maxChars > 16) fontSize = 13.8;
  else if (maxChars > 13) fontSize = 15.2;

  const w1 = estimateSvgTextWidth(line1, fontSize, true, false);
  const w2 = estimateSvgTextWidth(line2, fontSize, true, false);

  return [
    {
      text: line1,
      y: 78,
      fontSize,
      shouldSqueeze: w1 > MAX_SVG_TEXT_WIDTH,
    },
    {
      text: line2,
      y: 95,
      fontSize,
      shouldSqueeze: w2 > MAX_SVG_TEXT_WIDTH,
    },
  ];
}

/**
 * Compute Bottom Zone (y=103 to y=118, baseline y=113.5) reading line metrics:
 * - Base font size = 8.5 (half of the 17.0 definition font size)
 */
export function computeBottomZoneMetrics(
  text: string,
  isKanaScript = false
): { fontSize: number; shouldSqueeze: boolean } {
  if (!text) return { fontSize: BASE_READING_FONT_SIZE, shouldSqueeze: false };
  const charCount = Array.from(text).length;

  let fontSize = BASE_READING_FONT_SIZE;
  if (isKanaScript) {
    if (charCount > 14) fontSize = 7.6;
    else if (charCount > 11) fontSize = 8.0;
  } else {
    if (charCount > 26) fontSize = 7.6;
    else if (charCount > 21) fontSize = 8.0;
  }

  const totalUnits = estimateSvgTextWidth(text, fontSize, false, isKanaScript);
  return {
    fontSize,
    shouldSqueeze: totalUnits > 108,
  };
}
