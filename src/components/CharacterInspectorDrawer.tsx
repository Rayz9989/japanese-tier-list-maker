import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowRight, RotateCcw, Check, Copy } from 'lucide-react';
import { CharacterItem, TierRow } from '../types/characters';
import {
  JIS_LEVEL_1_SET,
  KANJI_GROUP_MAP,
  KANKEN_PRE1_SET,
} from '../data/kanjiClassification';
import {
  DECOMPOSITION_OPERATORS,
  getKanjiVisualDecomposition,
  isVisualOperator,
} from '../data/kanjiDecomposition';
import { CharacterSvgCard } from './CharacterSvgCard';

export interface CharacterInspectorDrawerProps {
  item: CharacterItem | null;
  onClose: () => void;
  tiers: TierRow[];
  currentTierId: string | null;
  onAssignTier: (itemId: string, tierId: string | null) => void;
  cardTheme: 'dark' | 'light';
  bottomZoneMode: 'romaji' | 'kana';
  underlineStandaloneKun: boolean;
}

const GLYPH_FONT_STACK = "'M PLUS 1 Code', 'Nishiki-teki', sans-serif";

/**
 * Renders any single glyph in a 3-operator visual formula, providing crisp vector stroke
 * rendering for CJK Extension B `𧘇` (U+27607) and `龰` (U+9FB0) which are absent from
 * standard web fonts while keeping their exact Unicode codepoint in the DOM for selection.
 */
const FormulaGlyphSpan: React.FC<{ glyph: string; className?: string }> = ({
  glyph,
  className = '',
}) => {
  if (glyph === '𧘇') {
    return (
      <span className={`inline ${className}`} title="𧘇 (U+27607 · garment bottom)">
        <svg
          viewBox="0 0 24 24"
          className="inline-block w-[1.05em] h-[1.05em] -mt-0.5 align-middle"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.5 4.5 C10.2 8.2 6.8 11.8 3.2 14.5" />
          <path d="M8.8 9.8 L8.8 19.5 L13.8 16.8" />
          <path d="M18.8 7.2 L14.5 11.2" />
          <path d="M12.2 9.2 C14.6 13.4 17.8 17.2 21.2 19.5" />
        </svg>
        <span className="sr-only">{glyph}</span>
      </span>
    );
  }

  if (glyph === '龰') {
    return (
      <span className={`inline ${className}`} title="龰 (U+9FB0 · foot-base)">
        <svg
          viewBox="0 0 24 24"
          className="inline-block w-[1.05em] h-[1.05em] -mt-0.5 align-middle"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4.5 L12 15.5" />
          <path d="M12 10.2 L19.2 10.2" />
          <path d="M7.5 8.8 C6.8 13.5 5.2 17.2 3.2 19.8" />
          <path d="M6.8 13.5 C10.8 16.8 15.6 19.2 21.2 19.8" />
        </svg>
        <span className="sr-only">{glyph}</span>
      </span>
    );
  }

  return (
    <span style={{ fontFamily: GLYPH_FONT_STACK }} className={className}>
      {glyph}
    </span>
  );
};

async function copyTextSafe(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

export const CharacterInspectorDrawer: React.FC<CharacterInspectorDrawerProps> = ({
  item,
  onClose,
  tiers,
  currentTierId,
  onAssignTier,
  cardTheme,
  bottomZoneMode,
  underlineStandaloneKun,
}) => {
  const [showRawKanaView, setShowRawKanaView] = useState(false);
  const [copiedChar, setCopiedChar] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState(false);

  useEffect(() => {
    setCopiedChar(false);
    setCopiedFormula(false);
  }, [item?.id]);

  const visualDecomp = useMemo(() => {
    if (!item) return null;
    const isK =
      item.category === 'joyo_kanji' ||
      item.category === 'jinmeiyo_kanji' ||
      item.category === 'hyogai_kanji';
    if (!isK) return null;
    return getKanjiVisualDecomposition(item.char);
  }, [item]);

  if (!item) return null;

  const isKanji =
    item.category === 'joyo_kanji' ||
    item.category === 'jinmeiyo_kanji' ||
    item.category === 'hyogai_kanji';

  const groupMeta =
    isKanji && item.kanjiGroup ? KANJI_GROUP_MAP.get(item.kanjiGroup) : undefined;

  const handleCopyCharacter = async () => {
    await copyTextSafe(item.char);
    setCopiedChar(true);
    setTimeout(() => setCopiedChar(false), 2000);
  };

  const handleCopyFormula = async () => {
    if (!visualDecomp) return;
    await copyTextSafe(visualDecomp.formula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  const categoryLabel =
    item.category === 'joyo_kanji'
      ? 'Jōyō Kanji'
      : item.category === 'jinmeiyo_kanji'
      ? 'Jinmeiyō Kanji'
      : item.category === 'hyogai_kanji'
      ? 'Hyōgai Kanji'
      : item.category === 'hiragana'
      ? `Hiragana · ${item.kanaSubtag?.replace('_', ' ') ?? 'syllable'}`
      : item.category === 'katakana'
      ? `Katakana · ${item.kanaSubtag?.replace('_', ' ') ?? 'syllable'}`
      : item.category === 'ligature'
      ? 'Kana Ligature (Gōryakugana)'
      : 'Native Japanese Symbol / Punctuation';

  const subheadingText = [
    categoryLabel,
    groupMeta ? `Tier ${groupMeta.id}` : null,
    item.isRadicalBase ? 'Radical Base' : null,
    item.unicodeHex,
  ]
    .filter(Boolean)
    .join(' · ');

  const gradeText =
    item.category === 'hyogai_kanji'
      ? item.isRadicalBase
        ? 'Hyōgai · Kangxi Radical Base'
        : 'Hyōgai (Outside Jōyō/Jinmeiyō)'
      : item.grade === null
      ? '—'
      : item.grade <= 6
      ? `Grade ${item.grade} (Elementary)`
      : item.grade === 8
      ? 'Secondary School (Jōyō)'
      : 'Jinmeiyō (Name Kanji)';

  const encodingStandards: string[] = [];
  if (isKanji) {
    if (item.jlpt) encodingStandards.push(`JLPT N${item.jlpt}`);
    if (KANKEN_PRE1_SET.has(item.char)) encodingStandards.push('Kanken Pre-1');
    if (JIS_LEVEL_1_SET.has(item.char)) encodingStandards.push('JIS Level 1');
    if (item.isRadicalBase) encodingStandards.push('Kangxi Radical');
  }

  return (
    <aside
      aria-label="Character Inspector"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
      style={{ fontFamily: "'Andika', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-100">Character Inspector</h2>
          <p data-testid="inspector-subheading" className="text-xs text-zinc-400 tabular-nums">
            {subheadingText}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Character Inspector"
          className="p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* 1–19 Kanji Classification Tier Banner (Color-Coded by Family) */}
        {isKanji && groupMeta && (
          <div
            data-testid="inspector-kanji-group-banner"
            className={`rounded-md border p-3 space-y-1 ${groupMeta.accentSurfaceClass} ${groupMeta.accentBorderClass}`}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className={`font-bold tabular-nums ${groupMeta.accentTextClass}`}>
                Tier {groupMeta.id} · {groupMeta.name}
              </span>
              <span className="text-[11px] text-zinc-300 whitespace-nowrap">
                {groupMeta.familyLabel}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              {groupMeta.description}
            </p>
            {encodingStandards.length > 0 && (
              <p className="text-[11px] text-zinc-400 pt-0.5 tabular-nums">
                {encodingStandards.join(' · ')}
              </p>
            )}
          </div>
        )}

        {/* Card Preview + Selectable Character Field + Copy Button + Metadata */}
        <div className="flex items-start gap-5">
          <CharacterSvgCard
            item={item}
            cardSize={136}
            cardTheme={cardTheme}
            bottomZoneMode={showRawKanaView ? 'kana' : bottomZoneMode}
            underlineStandaloneKun={underlineStandaloneKun}
          />
          <div className="flex-1 min-w-0 space-y-3 text-xs text-zinc-300">
            {/* Selectable Text Format Kanji / Character Field + Copy Kanji Button */}
            <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 space-y-1.5">
              <span className="text-[11px] text-zinc-400 block">
                Character (Selectable Text):
              </span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    data-testid="inspector-selectable-char"
                    style={{ fontFamily: GLYPH_FONT_STACK }}
                    className="text-3xl font-bold text-zinc-100 select-all cursor-text px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800"
                  >
                    {item.char}
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={item.char}
                    aria-label="Selectable character text field"
                    onFocus={(e) => e.currentTarget.select()}
                    style={{ fontFamily: GLYPH_FONT_STACK }}
                    className="w-12 text-center py-1 px-1.5 rounded bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-100 select-all focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopyCharacter}
                  aria-label="Copy Kanji"
                  className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    copiedChar
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                  }`}
                >
                  {copiedChar ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-zinc-400">Meanings / Label:</span>
              <p className="text-sm font-bold text-zinc-100 break-words mt-0.5 select-text">
                {item.meanings.join(' / ')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 tabular-nums">
              <div>
                <span className="text-zinc-400 block">Strokes</span>
                <span className="font-bold text-zinc-100">{item.strokes}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Frequency</span>
                <span className="font-bold text-zinc-100">
                  {item.frequency ? `#${item.frequency}` : '—'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-400 block">Legal / Grade Status</span>
                <span className="font-bold text-zinc-100">{gradeText}</span>
              </div>
              {isKanji && item.radicalNumber && (
                <div className="col-span-2">
                  <span className="text-zinc-400 block">Kangxi Radical</span>
                  <span className="font-bold text-zinc-100">
                    #{item.radicalNumber}{' '}
                    <span style={{ fontFamily: GLYPH_FONT_STACK }}>
                      {item.radicalGlyph}
                    </span>{' '}
                    ({item.radicalNameEn})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Synchronic Visual 3-Operator CJK Structural Decomposition */}
        {isKanji && visualDecomp && (
          <div
            data-testid="inspector-visual-decomposition"
            className="pt-4 border-t border-zinc-800 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-zinc-200">
                  Visual Structural Decomposition
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Synchronic 3-operator prefix formula (134 base units)
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyFormula}
                aria-label="Copy Visual Decomposition Formula"
                className={`px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  copiedFormula
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                {copiedFormula ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied Formula</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copy Formula</span>
                  </>
                )}
              </button>
            </div>

            {/* Prefix Formula Display */}
            <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 space-y-2">
              <div
                data-testid="inspector-decomposition-formula"
                className="text-xl font-bold tracking-wider text-zinc-100 break-all leading-relaxed select-all"
              >
                {[...visualDecomp.formula].map((tok, idx) => {
                  if (isVisualOperator(tok)) {
                    const opMeta = DECOMPOSITION_OPERATORS[tok];
                    return (
                      <span
                        key={idx}
                        style={{ fontFamily: GLYPH_FONT_STACK }}
                        title={`${tok} ${opMeta.name}: ${opMeta.orderHint}`}
                        className="text-amber-400 mx-0.5"
                      >
                        {tok}
                      </span>
                    );
                  }
                  return (
                    <FormulaGlyphSpan
                      key={idx}
                      glyph={tok}
                      className="text-zinc-100 mx-0.5"
                    />
                  );
                })}
              </div>

              {visualDecomp.isIndivisibleBase ? (
                <p className="text-[11px] text-emerald-300">
                  Indivisible Gestalt Base Unit (1 of 134 base kanji units —{' '}
                  {visualDecomp.baseComponents[0]?.labelEn})
                </p>
              ) : (
                <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {visualDecomp.operatorsUsed.map((op) => {
                    const m = DECOMPOSITION_OPERATORS[op];
                    return (
                      <span key={op} className="whitespace-nowrap">
                        <strong
                          style={{ fontFamily: GLYPH_FONT_STACK }}
                          className="text-amber-400"
                        >
                          {op}
                        </strong>{' '}
                        {m.name} ({m.orderHint})
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Constituent Base Units List */}
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400 block">
                Constituent Base Units ({visualDecomp.baseComponents.length}):
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-200">
                {visualDecomp.baseComponents.map((comp, idx) => {
                  const isAllograph = comp.glyph !== comp.canonicalBase;
                  return (
                    <span
                      key={`${comp.glyph}_${idx}`}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-950 border border-zinc-800"
                    >
                      <FormulaGlyphSpan glyph={comp.glyph} className="text-sm font-bold text-zinc-100" />
                      {isAllograph && (
                        <span className="text-zinc-400">
                          →{' '}
                          <FormulaGlyphSpan
                            glyph={comp.canonicalBase}
                            className="font-bold text-zinc-200"
                          />
                        </span>
                      )}
                      <span className="text-zinc-400">({comp.labelEn})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Tier Assignment */}
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-zinc-300">Assign to Tier Row</span>
            {currentTierId && (
              <button
                type="button"
                onClick={() => onAssignTier(item.id, null)}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return to Pool
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {tiers.map((t) => {
              const active = currentTierId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onAssignTier(item.id, active ? null : t.id)}
                  aria-label={`Assign ${item.char} to Tier ${t.label}`}
                  style={{
                    backgroundColor: active ? t.color : undefined,
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-zinc-950 ring-2 ring-white'
                      : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span>Tier {t.label}</span>
                  {active && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kanji Readings Breakdown (Deduplicated vs Full Un-Deduplicated) */}
        {isKanji && (
          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-200">
                Readings &amp; Root Underlining
              </h3>
              <button
                type="button"
                onClick={() => setShowRawKanaView((v) => !v)}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors whitespace-nowrap"
              >
                {showRawKanaView ? 'Viewing: Raw Kana (M PLUS 1 Code)' : 'Viewing: Custom Romaji (Andika)'}
              </button>
            </div>

            {/* Card Top Deduplicated Readings */}
            <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 space-y-1.5">
              <span className="text-xs text-zinc-400 block">
                Card Bottom-Zone String (Top Deduplicated Roots):
              </span>
              <div
                className="text-sm font-bold text-zinc-100 break-all"
                style={{
                  fontFamily: showRawKanaView ? GLYPH_FONT_STACK : "'Andika', sans-serif",
                }}
              >
                {item.cardReadings && item.cardReadings.length > 0 ? (
                  item.cardReadings.map((r, i) => {
                    const root = showRawKanaView ? r.rootKana : r.rootRomaji;
                    const okuri = showRawKanaView ? r.okuriganaKana : r.okuriganaRomaji;
                    const underline =
                      r.hasOkurigana || (underlineStandaloneKun && r.type === 'kun');
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && <span>/</span>}
                        {underline ? (
                          <>
                            <span className="underline decoration-amber-400 underline-offset-2">
                              {root}
                            </span>
                            <span>{okuri}</span>
                          </>
                        ) : (
                          <span>{root + okuri}</span>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <span className="text-zinc-500">None</span>
                )}
              </div>
            </div>

            {/* Full On'yomi List */}
            <div>
              <h4 className="text-xs text-zinc-400 mb-1.5">
                All On&apos;yomi Readings ({item.allOnReadings?.length ?? 0})
              </h4>
              {item.allOnReadings && item.allOnReadings.length > 0 ? (
                <div className="space-y-1">
                  {item.allOnReadings.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-zinc-950/60 border border-zinc-800/80"
                    >
                      <span style={{ fontFamily: GLYPH_FONT_STACK }} className="text-zinc-300">
                        {r.raw}
                        {r.resolvedKana !== r.raw.toLowerCase() && (
                          <span className="text-amber-300 ml-1.5">
                            → {r.resolvedKana}
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-zinc-100">{r.fullRomaji}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No On&apos;yomi readings</p>
              )}
            </div>

            {/* Full Un-Deduplicated Kun'yomi List */}
            <div>
              <h4 className="text-xs text-zinc-400 mb-1.5">
                All Un-Deduplicated Kun&apos;yomi Readings ({item.allKunReadings?.length ?? 0})
              </h4>
              {item.allKunReadings && item.allKunReadings.length > 0 ? (
                <div className="space-y-1">
                  {item.allKunReadings.map((r, idx) => {
                    const isPrimaryForRoot = item.deduplicatedKun?.some(
                      (d) => d.raw === r.raw
                    );
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-zinc-950/60 border border-zinc-800/80"
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: GLYPH_FONT_STACK }} className="text-zinc-300">
                            <span className="underline decoration-zinc-500 underline-offset-2">
                              {r.rootKana}
                            </span>
                            {r.okuriganaKana && <span>.{r.okuriganaKana}</span>}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-500" />
                          <span className="font-bold text-zinc-100">
                            {r.hasOkurigana ? (
                              <>
                                <span className="underline decoration-amber-400 underline-offset-2">
                                  {r.rootRomaji}
                                </span>
                                <span>{r.okuriganaRomaji}</span>
                              </>
                            ) : (
                              <span>{r.fullRomaji}</span>
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {isPrimaryForRoot ? 'Primary root' : `Deduplicated (${r.rootRomaji})`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No Kun&apos;yomi readings</p>
              )}
            </div>

            {/* Wiktionary Historical Yotsugana Source */}
            {item.wiktionaryTemplate && (
              <div className="pt-2">
                <h4 className="text-xs text-zinc-400 mb-1">
                  Wiktionary Historical Yotsugana Data
                </h4>
                <pre
                  style={{
                    fontFamily: "'M PLUS 1 Code', 'Nishiki-teki', monospace",
                  }}
                  className="text-[11px] text-zinc-300 bg-zinc-950 border border-zinc-800 rounded p-2.5 whitespace-pre-wrap break-all max-h-36 overflow-y-auto"
                >
                  {item.wiktionaryTemplate}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
