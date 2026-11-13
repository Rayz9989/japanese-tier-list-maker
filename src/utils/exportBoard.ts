import { CharacterItem, DoubleWidthMode, RankingTab } from '../types/characters';
import {
  computeBottomZoneMetrics,
  computeMiddleZoneLayout,
} from './cardLayout';
import {
  computeTierLabelLayout,
  resolveDoubleTierLabelWidth,
} from './tierLabelLayout';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a standalone vector SVG string of the current tab's Tier Board
 * with all ranked 3-zone character tiles and multi-line markdown tier labels.
 */
export function buildTierBoardSvgString(
  tab: RankingTab,
  itemMap: Map<string, CharacterItem>,
  cardTheme: 'dark' | 'light',
  bottomZoneMode: 'romaji' | 'kana',
  underlineStandaloneKun: boolean,
  doubleWidthMode: DoubleWidthMode = 'auto'
): string {
  const cardDim = 104;
  const cardGap = 8;
  const colsPerRow = 10;
  const isDoubleWidth = resolveDoubleTierLabelWidth(tab.tiers, doubleWidthMode, 8);
  const labelColWidth = isDoubleWidth ? 224 : 112;
  const rowPad = 12;
  const boardWidth = labelColWidth + rowPad * 2 + colsPerRow * (cardDim + cardGap);

  const isDarkCard = cardTheme === 'dark';
  const cardBg = isDarkCard ? '#18181b' : '#ffffff';
  const glyphColor = isDarkCard ? '#f4f4f5' : '#111827';
  const definitionColor = isDarkCard ? '#f4f4f5' : '#111827';
  const readingGrayColor = isDarkCard ? '#a1a1aa' : '#6b7280';
  const cardBorder = isDarkCard ? '#27272a' : '#e5e7eb';

  let currentY = 56;
  const rowElements: string[] = [];

  for (const tier of tab.tiers) {
    const items = tier.itemIds
      .map((id) => itemMap.get(id))
      .filter((x): x is CharacterItem => Boolean(x));

    const labelLayout = computeTierLabelLayout(tier.label, isDoubleWidth, tier.color);
    const totalLabelTextHeight = labelLayout.lines.reduce(
      (sum, l) => sum + Math.ceil(l.fontSizePx * 1.25),
      20
    );

    const numRows = Math.max(1, Math.ceil(items.length / colsPerRow));
    const cardsHeight = numRows * cardDim + (numRows - 1) * cardGap + rowPad * 2;
    const tierHeight = Math.max(cardsHeight, totalLabelTextHeight + 20);

    // Tier row container
    rowElements.push(
      `<rect x="16" y="${currentY}" width="${boardWidth - 32}" height="${tierHeight}" rx="8" fill="#18181b" stroke="#27272a" stroke-width="1"/>`
    );

    // Tier colored label block
    rowElements.push(
      `<rect x="16" y="${currentY}" width="${labelColWidth}" height="${tierHeight}" rx="8" fill="${escapeXml(tier.color)}"/>`
    );

    // Multi-line markdown tier label text
    const totalLinesBlockH = labelLayout.lines.reduce(
      (acc, l) => acc + l.fontSizePx * 1.22,
      0
    );
    let lineCursorY = currentY + (tierHeight - totalLinesBlockH) / 2;

    for (const line of labelLayout.lines) {
      lineCursorY += line.fontSizePx;
      const tspans = line.segments
        .map((seg) => {
          const weight = seg.bold ? '800' : line.isSubtext ? '400' : '700';
          const style = seg.italic ? ' font-style="italic"' : '';
          const deco = seg.underline ? ' text-decoration="underline"' : '';
          return `<tspan font-weight="${weight}"${style}${deco}>${escapeXml(seg.text)}</tspan>`;
        })
        .join('');
      const opacityAttr = line.isSubtext ? ' fill-opacity="0.72"' : '';
      rowElements.push(
        `<text x="${16 + labelColWidth / 2}" y="${lineCursorY.toFixed(1)}" text-anchor="middle" font-family="'Andika', sans-serif" font-size="${line.fontSizePx}" fill="${labelLayout.textColorHex}"${opacityAttr}>${tspans}</text>`
      );
      lineCursorY += line.fontSizePx * 0.22;
    }

    // Cards inside tier
    items.forEach((item, idx) => {
      const col = idx % colsPerRow;
      const r = Math.floor(idx / colsPerRow);
      const cx = 16 + labelColWidth + rowPad + col * (cardDim + cardGap);
      const cy = currentY + rowPad + r * (cardDim + cardGap);

      const isKanji =
        item.category === 'joyo_kanji' ||
        item.category === 'jinmeiyo_kanji' ||
        item.category === 'hyogai_kanji';
      const isSymbol = item.category === 'symbol';
      const useKana = bottomZoneMode === 'kana';

      const middleLines = computeMiddleZoneLayout(item.middleText);
      const middleMarkup = middleLines
        .map((line) => {
          const squeezeAttrs = line.shouldSqueeze
            ? ' textLength="110" lengthAdjust="spacingAndGlyphs"'
            : '';
          return `<text x="60" y="${line.y}" text-anchor="middle" font-size="${line.fontSize}" font-weight="700" fill="${definitionColor}" font-family="'Andika', sans-serif"${squeezeAttrs}>${escapeXml(line.text)}</text>`;
        })
        .join('\n          ');

      const combinedBottomString = isKanji
        ? (item.cardReadings || [])
            .map((rd) => (useKana ? rd.fullKana : rd.fullRomaji))
            .join('/')
        : isSymbol
        ? useKana
          ? item.bottomKanaText || item.bottomText
          : item.bottomText
        : '';

      const bottomMetrics = computeBottomZoneMetrics(combinedBottomString, useKana);
      const bottomSqueezeAttrs = bottomMetrics.shouldSqueeze
        ? ' textLength="110" lengthAdjust="spacingAndGlyphs"'
        : '';

      let bottomMarkup = '';
      if (isKanji && item.cardReadings && item.cardReadings.length > 0) {
        const tspans = item.cardReadings
          .map((rd, rIdx) => {
            const root = escapeXml(useKana ? rd.rootKana : rd.rootRomaji);
            const okuri = escapeXml(useKana ? rd.okuriganaKana : rd.okuriganaRomaji);
            const sep = rIdx > 0 ? '<tspan>/</tspan>' : '';
            const shouldUnderline =
              rd.hasOkurigana || (underlineStandaloneKun && rd.type === 'kun');
            if (shouldUnderline) {
              return `${sep}<tspan text-decoration="underline">${root}</tspan>${okuri ? `<tspan>${okuri}</tspan>` : ''}`;
            }
            return `${sep}<tspan>${root}${okuri}</tspan>`;
          })
          .join('');
        bottomMarkup = `<text x="60" y="113.5" text-anchor="middle" font-size="${bottomMetrics.fontSize}" font-weight="400" fill="${readingGrayColor}" font-family="'Andika', sans-serif"${bottomSqueezeAttrs}>${tspans}</text>`;
      } else if (isSymbol && combinedBottomString) {
        bottomMarkup = `<text x="60" y="113.5" text-anchor="middle" font-size="${bottomMetrics.fontSize}" font-weight="400" fill="${readingGrayColor}" font-family="'Andika', sans-serif"${bottomSqueezeAttrs}>${escapeXml(combinedBottomString)}</text>`;
      }

      rowElements.push(`
        <svg x="${cx}" y="${cy}" width="${cardDim}" height="${cardDim}" viewBox="0 0 120 120">
          <rect x="1" y="1" width="118" height="118" rx="6" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1.5"/>
          <line x1="8" y1="62" x2="112" y2="62" stroke="${cardBorder}" stroke-width="0.75" stroke-opacity="0.65"/>
          <text x="60" y="48" text-anchor="middle" font-size="46" font-weight="500" fill="${glyphColor}" font-family="'M PLUS 1 Code', 'Noto Sans JP', sans-serif">${escapeXml(item.char)}</text>
          ${middleMarkup}
          ${bottomMarkup}
        </svg>
      `);
    });

    currentY += tierHeight + 10;
  }

  const totalHeight = currentY + 16;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${totalHeight}" viewBox="0 0 ${boardWidth} ${totalHeight}">
  <rect width="100%" height="100%" fill="#09090b"/>
  <text x="20" y="36" font-family="'Andika', sans-serif" font-size="20" font-weight="700" fill="#f4f4f5">${escapeXml(tab.name)} — Kanji &amp; Kana Tier List</text>
  ${rowElements.join('\n  ')}
</svg>`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadTierBoardPng(
  tab: RankingTab,
  itemMap: Map<string, CharacterItem>,
  cardTheme: 'dark' | 'light',
  bottomZoneMode: 'romaji' | 'kana',
  underlineStandaloneKun: boolean,
  doubleWidthMode: DoubleWidthMode = 'auto'
): Promise<void> {
  const svgString = buildTierBoardSvgString(
    tab,
    itemMap,
    cardTheme,
    bottomZoneMode,
    underlineStandaloneKun,
    doubleWidthMode
  );
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            const pngUrl = URL.createObjectURL(pngBlob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${tab.name.toLowerCase().replace(/\s+/g, '-')}-tier-board.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
          }
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/png');
      } else {
        URL.revokeObjectURL(url);
        resolve();
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });
}
