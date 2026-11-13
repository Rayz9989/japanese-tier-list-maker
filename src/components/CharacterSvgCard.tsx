import React from 'react';
import { CharacterItem } from '../types/characters';
import {
  computeBottomZoneMetrics,
  computeMiddleZoneLayout,
} from '../utils/cardLayout';

export interface CharacterSvgCardProps {
  item: CharacterItem;
  cardSize: number;
  cardTheme: 'dark' | 'light';
  bottomZoneMode: 'romaji' | 'kana';
  underlineStandaloneKun?: boolean;
  isSelected?: boolean;
  onSelect?: (item: CharacterItem) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, item: CharacterItem) => void;
  onQuickRemoveFromTier?: (item: CharacterItem) => void;
  inTierId?: string;
}

export const CharacterSvgCard: React.FC<CharacterSvgCardProps> = React.memo(
  ({
    item,
    cardSize,
    cardTheme,
    bottomZoneMode,
    underlineStandaloneKun = false,
    isSelected = false,
    onSelect,
    onDragStart,
    onQuickRemoveFromTier,
    inTierId,
  }) => {
    const isDark = cardTheme === 'dark';
    const bgFill = isDark ? '#18181b' : '#ffffff';
    const glyphFill = isDark ? '#f4f4f5' : '#111827';
    // Definition / Middle Zone is prominently bolded & black (in light cards) / crisp light (in dark cards)
    const definitionFill = isDark ? '#f4f4f5' : '#111827';
    // Readings / Bottom Zone is the muted gray one
    const readingGrayFill = isDark ? '#a1a1aa' : '#6b7280';
    const borderStroke = isSelected
      ? '#f59e0b'
      : isDark
      ? '#27272a'
      : '#e5e7eb';

    // Middle Zone (y=63 to y=101): 2x reading font size (17px vs 8.5px), 1 or 2 lines, vertically centered when 1 line
    const middleLines = computeMiddleZoneLayout(item.middleText);

    // Bottom Zone (y=103 to y=118)
    const isKanji = item.category === 'joyo_kanji' || item.category === 'jinmeiyo_kanji';
    const isSymbol = item.category === 'symbol';
    const useKanaBottom = bottomZoneMode === 'kana';

    const combinedBottomString = isKanji
      ? (item.cardReadings || [])
          .map((r) => (useKanaBottom ? r.fullKana : r.fullRomaji))
          .join('/')
      : isSymbol
      ? useKanaBottom
        ? item.bottomKanaText || item.bottomText
        : item.bottomText
      : '';

    const bottomMetrics = computeBottomZoneMetrics(
      combinedBottomString,
      useKanaBottom
    );

    return (
      <div
        draggable
        onDragStart={(e) => onDragStart?.(e, item)}
        onClick={() => onSelect?.(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.(item);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${item.char} - ${item.middleText}${combinedBottomString ? ` (${combinedBottomString})` : ''}`}
        style={{ width: `${cardSize}px`, height: `${cardSize}px` }}
        className={`group relative shrink-0 select-none cursor-grab active:cursor-grabbing rounded-md transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
          isSelected ? 'ring-2 ring-amber-400' : ''
        }`}
      >
        <svg
          viewBox="0 0 120 120"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full h-full rounded-md overflow-hidden"
        >
          {/* Card Background & Border */}
          <rect
            x="1"
            y="1"
            width="118"
            height="118"
            rx="6"
            fill={bgFill}
            stroke={borderStroke}
            strokeWidth={isSelected ? '2.5' : '1.5'}
          />

          {/* Subtle zone divider line at y=62 (reserving y=63..101 for 1- or 2-line Middle Zone without ever shifting the kanji glyph) */}
          <line
            x1="8"
            y1="62"
            x2="112"
            y2="62"
            stroke={borderStroke}
            strokeWidth="0.75"
            strokeOpacity="0.65"
          />

          {/* Top/Center Zone (y=2 to y=62): Character glyph fixed at x=60, y=48, fontSize=46 across ALL cards */}
          <text
            x="60"
            y="48"
            textAnchor="middle"
            fontSize="46"
            fontWeight="500"
            fill={glyphFill}
            fontFamily="'M PLUS 1 Code', 'Noto Sans JP', sans-serif"
          >
            {item.char}
          </text>

          {/* Middle Zone (y=63 to y=101): Prominently bolded definition/translation (2x reading size, 1 or 2 lines, vertically centered when 1 line) */}
          {middleLines.map((line, idx) => (
            <text
              key={idx}
              x="60"
              y={line.y}
              textAnchor="middle"
              fontSize={line.fontSize}
              fontWeight="700"
              fill={definitionFill}
              fontFamily="'Andika', sans-serif"
              {...(line.shouldSqueeze
                ? { textLength: 110, lengthAdjust: 'spacingAndGlyphs' as const }
                : {})}
            >
              {line.text}
            </text>
          ))}

          {/* Bottom Zone (y=103 to y=118): Gray readings with Wiktionary-style underlined kanji roots */}
          {isKanji && item.cardReadings && item.cardReadings.length > 0 && (
            <text
              x="60"
              y="113.5"
              textAnchor="middle"
              fontSize={bottomMetrics.fontSize}
              fontWeight="400"
              fill={readingGrayFill}
              fontFamily={
                useKanaBottom
                  ? "'M PLUS 1 Code', 'Noto Sans JP', sans-serif"
                  : "'Andika', sans-serif"
              }
              {...(bottomMetrics.shouldSqueeze
                ? { textLength: 110, lengthAdjust: 'spacingAndGlyphs' as const }
                : {})}
            >
              {item.cardReadings.map((r, idx) => {
                const rootText = useKanaBottom ? r.rootKana : r.rootRomaji;
                const okuriText = useKanaBottom ? r.okuriganaKana : r.okuriganaRomaji;
                const shouldUnderlineRoot =
                  r.hasOkurigana || (underlineStandaloneKun && r.type === 'kun');

                return (
                  <React.Fragment key={`${r.raw}_${idx}`}>
                    {idx > 0 && <tspan>/</tspan>}
                    {shouldUnderlineRoot ? (
                      <>
                        <tspan textDecoration="underline">{rootText}</tspan>
                        {okuriText && <tspan>{okuriText}</tspan>}
                      </>
                    ) : (
                      <tspan>{rootText + okuriText}</tspan>
                    )}
                  </React.Fragment>
                );
              })}
            </text>
          )}

          {/* Bottom Zone for Native Japanese Symbols */}
          {isSymbol && combinedBottomString && (
            <text
              x="60"
              y="113.5"
              textAnchor="middle"
              fontSize={bottomMetrics.fontSize}
              fontWeight="400"
              fill={readingGrayFill}
              fontFamily={
                useKanaBottom
                  ? "'M PLUS 1 Code', 'Noto Sans JP', sans-serif"
                  : "'Andika', sans-serif"
              }
              {...(bottomMetrics.shouldSqueeze
                ? { textLength: 110, lengthAdjust: 'spacingAndGlyphs' as const }
                : {})}
            >
              {combinedBottomString}
            </text>
          )}
        </svg>

        {/* Quick unrank button when inside a tier row */}
        {inTierId && onQuickRemoveFromTier && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickRemoveFromTier(item);
            }}
            aria-label={`Remove ${item.char} from tier`}
            title="Return to unranked pool"
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-1 right-1 w-5 h-5 rounded bg-zinc-900/90 text-zinc-200 hover:bg-red-600 hover:text-white flex items-center justify-center text-xs leading-none transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    );
  }
);
