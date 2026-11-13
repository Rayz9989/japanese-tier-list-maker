import { TierRow } from '../types/characters';

export interface MarkdownSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface ParsedTierLine {
  /** Original raw line or wrapped sub-line */
  rawText: string;
  /** Plain visible text without markdown markers */
  plainText: string;
  /** True if line started with -# (subtext: smaller & faded) */
  isSubtext: boolean;
  /** Computed font size in px for this line */
  fontSizePx: number;
  /** Parsed inline segments for bold, italic, underline */
  segments: MarkdownSegment[];
}

export interface TierLabelLayoutResult {
  lines: ParsedTierLine[];
  isDoubleWidth: boolean;
  labelWidthPx: number;
  textColorHex: string;
}

/**
 * Validate and normalize a user-entered hex color string (supports #RGB, RGB, #RRGGBB, RRGGBB).
 * Returns normalized 7-char lowercase `#rrggbb` if valid, or null if invalid.
 */
export function normalizeHexColor(input: string): string | null {
  const cleaned = (input || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const r = cleaned[0].toLowerCase();
    const g = cleaned[1].toLowerCase();
    const b = cleaned[2].toLowerCase();
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toLowerCase()}`;
  }
  return null;
}

/**
 * Strip markdown markers (**bold**, *italics*, __underline__, _underline_, ~underline~, <u>underline</u>, -#subtext)
 * to measure visible character length.
 */
export function stripTierMarkdown(raw: string): string {
  if (!raw) return '';
  return raw
    .split('\n')
    .map((line) =>
      line
        .replace(/^-#\s*/, '')
        .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/<u>([^<]+)<\/u>/gi, '$1')
        .replace(/~([^~]+)~/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
    )
    .join('\n');
}

/**
 * Format a tier label for single-line inline display in the empty-tier placeholder:
 * Flattens newlines to spaces, strips markdown symbols, and truncates with `...` after `maxChars`.
 */
export function formatPlaceholderTierName(rawLabel: string, maxChars = 28): string {
  const plain = stripTierMarkdown(rawLabel || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return 'Unnamed';
  const chars = Array.from(plain);
  if (chars.length > maxChars) {
    return chars.slice(0, maxChars).join('').trimEnd() + '...';
  }
  return plain;
}

/**
 * Parse inline markdown within a single line:
 * - `***bold italic***` -> bold + italic
 * - `**bold**` -> bold
 * - `*italics*` -> italic
 * - `__underline__`, `_underline_`, `~underline~`, or `<u>underline</u>` -> underline
 */
export function parseInlineMarkdown(text: string): MarkdownSegment[] {
  if (!text) return [];
  const segments: MarkdownSegment[] = [];
  const regex =
    /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|<u>[^<]+<\/u>|~[^~]+~|\*[^*]+\*|_[^_]+_)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('***') && token.endsWith('***')) {
      segments.push({ text: token.slice(3, -3), bold: true, italic: true });
    } else if (token.startsWith('**') && token.endsWith('**')) {
      segments.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('__') && token.endsWith('__')) {
      segments.push({ text: token.slice(2, -2), underline: true });
    } else if (token.toLowerCase().startsWith('<u>') && token.toLowerCase().endsWith('</u>')) {
      segments.push({ text: token.slice(3, -4), underline: true });
    } else if (token.startsWith('~') && token.endsWith('~')) {
      segments.push({ text: token.slice(1, -1), underline: true });
    } else if (token.startsWith('_') && token.endsWith('_')) {
      segments.push({ text: token.slice(1, -1), underline: true });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      segments.push({ text: token.slice(1, -1), italic: true });
    } else {
      segments.push({ text: token });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text }];
}

/**
 * Condition: if a significant majority (>= 60%) of tier names exceed `threshold` visible characters,
 * multiply the horizontal width of all tier label boxes by 2 (112px -> 224px) so names don't shrink as much.
 */
export function shouldDoubleTierLabelWidth(
  tiers: readonly Pick<TierRow, 'label'>[],
  threshold = 8
): boolean {
  if (!tiers || tiers.length === 0) return false;
  let longCount = 0;
  for (const t of tiers) {
    const plain = stripTierMarkdown(t.label).replace(/\s+/g, ' ').trim();
    if (Array.from(plain).length > threshold) {
      longCount++;
    }
  }
  const requiredMajority = Math.max(1, Math.ceil(tiers.length * 0.6));
  return longCount >= requiredMajority;
}

/**
 * Resolve whether tier labels should be double width (224px vs 112px) based on user toggle mode ('auto' | 'off' | 'always').
 */
export function resolveDoubleTierLabelWidth(
  tiers: readonly Pick<TierRow, 'label'>[],
  mode: 'auto' | 'off' | 'always',
  threshold = 8
): boolean {
  if (mode === 'always') return true;
  if (mode === 'off') return false;
  return shouldDoubleTierLabelWidth(tiers, threshold);
}

/**
 * Compute readable text color (#09090b dark or #f4f4f5 light) for any background hex color.
 */
export function getContrastTextColor(hexColor: string): string {
  const clean = hexColor.replace('#', '').trim();
  let r = 250,
    g = 200,
    b = 100;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) || 0;
    g = parseInt(clean[1] + clean[1], 16) || 0;
    b = parseInt(clean[2] + clean[2], 16) || 0;
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) || 0;
    g = parseInt(clean.slice(2, 4), 16) || 0;
    b = parseInt(clean.slice(4, 6), 16) || 0;
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? '#09090b' : '#f4f4f5';
}

/**
 * Wrap a multi-word line at spaces into balanced sub-lines so single words are NEVER split across lines.
 */
function wrapWordsIntoLines(rawLine: string, maxCharsPerLine: number): string[] {
  const words = rawLine.trim().split(/\s+/);
  if (words.length <= 1) {
    return [rawLine.trim()];
  }

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    const candidate = `${current} ${w}`;
    const candidatePlainLen = Array.from(stripTierMarkdown(candidate)).length;
    if (candidatePlainLen <= maxCharsPerLine) {
      current = candidate;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Compute full multi-line layout for a tier label:
 * - Supports explicit `\n` newlines
 * - Supports `-#subtext` prefix (smaller and faded)
 * - Supports `**bold**`, `*italics*`, and `__underline__` / `_underline_` / `~underline~` / `<u>underline</u>`
 * - Shrinking & wrapping behavior:
 *   1. Short line: stays at base font size (20px, or 12.5px for `-#subtext`)
 *   2. Moderately long line: shrinks slightly down to a threshold (14px) on 1 line
 *   3. Beyond threshold:
 *      - If multiple words: splits at word boundaries across multiple lines (never splitting a single word across lines)
 *      - If a single unbroken word: keeps shrinking on 1 line so the word stays on 1 line without clipping!
 */
export function computeTierLabelLayout(
  rawLabel: string,
  isDoubleWidth: boolean,
  bgColorHex = '#f87171'
): TierLabelLayoutResult {
  const labelWidthPx = isDoubleWidth ? 224 : 112;
  const usableWidthPx = labelWidthPx - 16; // 8px horizontal padding on each side
  const textColorHex = getContrastTextColor(bgColorHex);

  const rawParagraphs = (rawLabel || '').split('\n');
  const parsedLines: ParsedTierLine[] = [];

  const baseFontPx = 20;
  const minShrinkBeforeWrapPx = 14;
  // At 14px, each character is ~8.0px wide
  const wrapCharThreshold = Math.floor(usableWidthPx / 8.0); // 12 chars normal (96px), 26 chars double-width (208px)

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      parsedLines.push({
        rawText: '',
        plainText: '',
        isSubtext: false,
        fontSizePx: 10,
        segments: [{ text: '\u00A0' }],
      });
      continue;
    }

    const isSubtext = trimmed.startsWith('-#');
    const contentRaw = isSubtext ? trimmed.replace(/^-#\s*/, '') : trimmed;
    const plain = stripTierMarkdown(contentRaw);
    const plainLen = Array.from(plain).length;
    const hasSpaces = /\s/.test(plain.trim());

    if (isSubtext) {
      const subWrapThreshold = Math.floor(usableWidthPx / 6.8);
      const subLines =
        hasSpaces && plainLen > subWrapThreshold
          ? wrapWordsIntoLines(contentRaw, subWrapThreshold)
          : [contentRaw];

      for (const sl of subLines) {
        const slPlain = stripTierMarkdown(sl);
        const slLen = Math.max(1, Array.from(slPlain).length);
        const fitPx = Math.min(12.5, Math.max(8, Math.floor(usableWidthPx / (slLen * 0.58))));
        parsedLines.push({
          rawText: sl,
          plainText: slPlain,
          isSubtext: true,
          fontSizePx: fitPx,
          segments: parseInlineMarkdown(sl),
        });
      }
      continue;
    }

    // Standard tier heading line
    if (plainLen <= wrapCharThreshold || !hasSpaces) {
      // Either fits within the slight-shrink threshold OR is a single unbroken word (which must keep shrinking rather than splitting mid-word)
      const naturalPx = Math.floor(usableWidthPx / (Math.max(1, plainLen) * 0.62));
      const fontSizePx = hasSpaces
        ? Math.min(baseFontPx, Math.max(minShrinkBeforeWrapPx, naturalPx))
        : Math.min(baseFontPx, Math.max(7.5, naturalPx));

      parsedLines.push({
        rawText: contentRaw,
        plainText: plain,
        isSubtext: false,
        fontSizePx,
        segments: parseInlineMarkdown(contentRaw),
      });
    } else {
      // Multi-word line exceeding threshold: wrap at word boundaries so no single word is ever split across lines!
      const wrappedSubLines = wrapWordsIntoLines(contentRaw, wrapCharThreshold);
      for (const wl of wrappedSubLines) {
        const wlPlain = stripTierMarkdown(wl);
        const wlLen = Math.max(1, Array.from(wlPlain).length);
        const naturalPx = Math.floor(usableWidthPx / (wlLen * 0.62));
        const fontSizePx = Math.min(16, Math.max(7.5, naturalPx));
        parsedLines.push({
          rawText: wl,
          plainText: wlPlain,
          isSubtext: false,
          fontSizePx,
          segments: parseInlineMarkdown(wl),
        });
      }
    }
  }

  return {
    lines: parsedLines,
    isDoubleWidth,
    labelWidthPx,
    textColorHex,
  };
}
