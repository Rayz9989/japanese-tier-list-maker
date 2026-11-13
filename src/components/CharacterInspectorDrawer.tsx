import React, { useState, useEffect } from 'react';
import { X, ArrowRight, RotateCcw, Check, Copy } from 'lucide-react';
import { CharacterItem, TierRow } from '../types/characters';
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

  useEffect(() => {
    setCopiedChar(false);
  }, [item?.id]);

  if (!item) return null;

  const isKanji =
    item.category === 'joyo_kanji' ||
    item.category === 'jinmeiyo_kanji' ||
    item.category === 'hyogai_kanji';

  const handleCopyCharacter = async () => {
    try {
      await navigator.clipboard.writeText(item.char);
      setCopiedChar(true);
      setTimeout(() => setCopiedChar(false), 2000);
    } catch {
      // Fallback copy via temporary textarea
      const ta = document.createElement('textarea');
      ta.value = item.char;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedChar(true);
      setTimeout(() => setCopiedChar(false), 2000);
    }
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

  const subheadingText = item.isRadicalBase
    ? `${categoryLabel} · Radical Base · ${item.unicodeHex}`
    : `${categoryLabel} · ${item.unicodeHex}`;

  const gradeText =
    item.category === 'hyogai_kanji'
      ? 'Hyōgai (Kangxi Radical Base)'
      : item.grade === null
      ? '—'
      : item.grade <= 6
      ? `Grade ${item.grade} (Elementary)`
      : item.grade === 8
      ? 'Secondary School (Jōyō)'
      : 'Jinmeiyō (Name Kanji)';

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
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
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
                    style={{
                      fontFamily: "'M PLUS 1 Code', 'Noto Sans JP', sans-serif",
                    }}
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
                    style={{
                      fontFamily: "'M PLUS 1 Code', 'Noto Sans JP', sans-serif",
                    }}
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
                      <span>Copy Kanji</span>
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
                <span className="text-zinc-400 block">School Grade</span>
                <span className="font-bold text-zinc-100">{gradeText}</span>
              </div>
              {isKanji && item.radicalNumber && (
                <div className="col-span-2">
                  <span className="text-zinc-400 block">Kangxi Radical</span>
                  <span className="font-bold text-zinc-100">
                    #{item.radicalNumber}{' '}
                    <span
                      style={{
                        fontFamily: "'M PLUS 1 Code', 'Noto Sans JP', sans-serif",
                      }}
                    >
                      {item.radicalGlyph}
                    </span>{' '}
                    ({item.radicalNameEn})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

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
                  fontFamily: showRawKanaView
                    ? "'M PLUS 1 Code', 'Noto Sans JP', sans-serif"
                    : "'Andika', sans-serif",
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
                      <span
                        style={{
                          fontFamily: "'M PLUS 1 Code', 'Noto Sans JP', sans-serif",
                        }}
                        className="text-zinc-300"
                      >
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
                          <span
                            style={{
                              fontFamily: "'M PLUS 1 Code', 'Noto Sans JP', sans-serif",
                            }}
                            className="text-zinc-300"
                          >
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
                    fontFamily: "'M PLUS 1 Code', 'Noto Sans JP', monospace",
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
