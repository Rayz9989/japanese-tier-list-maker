import React, { useState } from 'react';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  RotateCcw,
  Palette,
  Check,
  X,
} from 'lucide-react';
import { CharacterItem, DoubleWidthMode, TierRow } from '../types/characters';
import { CharacterSvgCard } from './CharacterSvgCard';
import {
  computeTierLabelLayout,
  formatPlaceholderTierName,
  normalizeHexColor,
  resolveDoubleTierLabelWidth,
  stripTierMarkdown,
} from '../utils/tierLabelLayout';

export interface TierBoardProps {
  tiers: TierRow[];
  itemMap: Map<string, CharacterItem>;
  cardSize: number;
  cardTheme: 'dark' | 'light';
  bottomZoneMode: 'romaji' | 'kana';
  underlineStandaloneKun: boolean;
  doubleWidthMode: DoubleWidthMode;
  selectedItemId: string | null;
  onSelectItem: (item: CharacterItem) => void;
  onDropItemToTier: (itemId: string, targetTierId: string) => void;
  onRemoveItemFromTier: (itemId: string) => void;
  onUpdateTier: (tierId: string, patch: Partial<Pick<TierRow, 'label' | 'color'>>) => void;
  onMoveTierRow: (tierId: string, direction: 'up' | 'down') => void;
  onAddTierRow: () => void;
  onClearTierRow: (tierId: string) => void;
  onDeleteTierRow: (tierId: string) => void;
}

const TIER_PALETTE = [
  '#f87171', // Red (S)
  '#fb923c', // Orange (A)
  '#fbbf24', // Amber (B)
  '#facc15', // Yellow (C)
  '#a3e635', // Lime (D)
  '#38bdf8', // Sky (E)
  '#c084fc', // Purple (F)
  '#f472b6', // Pink
  '#34d399', // Emerald
  '#94a3b8', // Slate
  '#ef4444', // Crimson
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#eab308', // Gold
];

export const TierBoard: React.FC<TierBoardProps> = ({
  tiers,
  itemMap,
  cardSize,
  cardTheme,
  bottomZoneMode,
  underlineStandaloneKun,
  doubleWidthMode,
  selectedItemId,
  onSelectItem,
  onDropItemToTier,
  onRemoveItemFromTier,
  onUpdateTier,
  onMoveTierRow,
  onAddTierRow,
  onClearTierRow,
  onDeleteTierRow,
}) => {
  const [dragOverTierId, setDragOverTierId] = useState<string | null>(null);
  const [openColorPickerTierId, setOpenColorPickerTierId] = useState<string | null>(null);
  const [editingLabelTierId, setEditingLabelTierId] = useState<string | null>(null);
  const [customHexDraft, setCustomHexDraft] = useState<string>('');

  // Resolve 2x horizontal width based on user mode ('auto' | 'off' | 'always')
  const isDoubleWidth = resolveDoubleTierLabelWidth(tiers, doubleWidthMode, 8);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: CharacterItem) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleOpenColorPopover = (tier: TierRow) => {
    if (openColorPickerTierId === tier.id) {
      setOpenColorPickerTierId(null);
    } else {
      setOpenColorPickerTierId(tier.id);
      setCustomHexDraft(tier.color);
    }
  };

  const handleApplyCustomHex = (tierId: string, rawInput: string) => {
    const normalized = normalizeHexColor(rawInput);
    if (normalized) {
      onUpdateTier(tierId, { color: normalized });
      setCustomHexDraft(normalized);
    }
  };

  return (
    <section
      aria-label="Tier List Board"
      className="space-y-2"
      style={{ fontFamily: "'Andika', sans-serif" }}
    >
      <div className="space-y-1.5">
        {tiers.map((tier, idx) => {
          const isDragOver = dragOverTierId === tier.id;
          const tierItems = tier.itemIds
            .map((id) => itemMap.get(id))
            .filter((x): x is CharacterItem => Boolean(x));

          const labelLayout = computeTierLabelLayout(
            tier.label,
            isDoubleWidth,
            tier.color
          );
          const plainAriaName =
            stripTierMarkdown(tier.label).replace(/\s+/g, ' ').trim() || 'Unnamed';
          const isEditingThisLabel = editingLabelTierId === tier.id;
          const textareaRows = Math.max(2, (tier.label || '').split('\n').length);

          return (
            <div
              key={tier.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverTierId !== tier.id) setDragOverTierId(tier.id);
              }}
              onDragLeave={() => {
                if (dragOverTierId === tier.id) setDragOverTierId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverTierId(null);
                const droppedId = e.dataTransfer.getData('text/plain');
                if (droppedId) {
                  onDropItemToTier(droppedId, tier.id);
                }
              }}
              className={`flex items-stretch rounded-lg border transition-colors ${
                isDragOver
                  ? 'border-amber-400 bg-zinc-900/90'
                  : 'border-zinc-800 bg-zinc-900'
              }`}
              style={{
                minHeight:
                  tierItems.length > 0 || isDragOver
                    ? `${Math.max(88, cardSize + 16)}px`
                    : '56px',
              }}
            >
              {/* Left Tier Header Block — dynamically expands vertically and doubles width when majority of tier names are long */}
              <div
                data-testid={`tier-label-box-${tier.id}`}
                data-double-width={isDoubleWidth ? 'true' : 'false'}
                style={{
                  backgroundColor: tier.color,
                  width: `${labelLayout.labelWidthPx}px`,
                  color: labelLayout.textColorHex,
                }}
                onClick={() => {
                  if (!isEditingThisLabel) {
                    setEditingLabelTierId(tier.id);
                  }
                }}
                title="Click to edit tier name (supports multiple lines, **bold**, *italics*, _underline_, and -#subtext)"
                className="shrink-0 rounded-l-[7px] flex flex-col items-center justify-center py-2 px-2 relative cursor-text select-none transition-[width] duration-150"
              >
                {isEditingThisLabel ? (
                  <textarea
                    autoFocus
                    rows={textareaRows}
                    value={tier.label}
                    aria-label={`Tier ${plainAriaName} name`}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateTier(tier.id, { label: e.target.value })}
                    onBlur={() => setEditingLabelTierId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingLabelTierId(null);
                      }
                    }}
                    placeholder="Tier name..."
                    style={{ color: labelLayout.textColorHex }}
                    className="w-full bg-black/15 text-center font-bold text-sm leading-snug focus:outline-none focus:ring-1 focus:ring-current rounded px-1.5 py-1 resize-y"
                  />
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Tier ${plainAriaName} name`}
                    onFocus={() => setEditingLabelTierId(tier.id)}
                    className="w-full flex flex-col items-center justify-center text-center gap-0.5 overflow-visible"
                  >
                    {labelLayout.lines.map((line, lineIdx) => (
                      <div
                        key={lineIdx}
                        style={{
                          fontSize: `${line.fontSizePx}px`,
                          lineHeight: line.isSubtext ? 1.2 : 1.18,
                          opacity: line.isSubtext ? 0.72 : 1,
                        }}
                        className={`w-full text-center whitespace-nowrap ${
                          line.isSubtext ? 'font-normal' : 'font-bold'
                        }`}
                      >
                        {line.segments.map((seg, sIdx) => (
                          <span
                            key={sIdx}
                            className={[
                              seg.bold ? 'font-extrabold' : '',
                              seg.italic ? 'italic' : '',
                              seg.underline
                                ? 'underline decoration-current underline-offset-2'
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {seg.text}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <span
                  style={{ color: labelLayout.textColorHex, opacity: 0.72 }}
                  className="mt-1 text-[10px] font-bold tabular-nums pointer-events-none"
                >
                  {tierItems.length} {tierItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Center Tier Drop Zone */}
              <div className="flex-1 p-1.5 flex flex-wrap items-center gap-2 min-w-0">
                {tierItems.length === 0 ? (
                  <div className="w-full h-full min-h-[40px] flex items-center justify-start text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-md px-3 overflow-hidden">
                    <span
                      data-testid={`tier-placeholder-${tier.id}`}
                      style={{
                        paddingLeft: 'clamp(4px, calc(50% - 218px), 380px)',
                      }}
                      className="block w-full truncate text-left whitespace-nowrap text-ellipsis pr-2"
                    >
                      Drag characters here or click any card below to inspect &amp; assign to Tier{' '}
                      {formatPlaceholderTierName(tier.label, 28)}
                    </span>
                  </div>
                ) : (
                  tierItems.map((item) => (
                    <CharacterSvgCard
                      key={item.id}
                      item={item}
                      cardSize={cardSize}
                      cardTheme={cardTheme}
                      bottomZoneMode={bottomZoneMode}
                      underlineStandaloneKun={underlineStandaloneKun}
                      isSelected={selectedItemId === item.id}
                      onSelect={onSelectItem}
                      onDragStart={handleDragStart}
                      inTierId={tier.id}
                      onQuickRemoveFromTier={(it) => onRemoveItemFromTier(it.id)}
                    />
                  ))
                )}
              </div>

              {/* Right Tier Row Controls */}
              <div className="w-20 sm:w-24 shrink-0 border-l border-zinc-800 flex items-center justify-center gap-1 px-1.5 relative">
                <button
                  type="button"
                  onClick={() => onMoveTierRow(tier.id, 'up')}
                  disabled={idx === 0}
                  aria-label={`Move Tier ${plainAriaName} up`}
                  className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-25 transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenColorPopover(tier)}
                  aria-label={`Customize Tier ${plainAriaName} color and label`}
                  title="Customize tier hex color & multi-line markdown label"
                  className={`p-1 transition-colors ${
                    openColorPickerTierId === tier.id
                      ? 'text-amber-400'
                      : 'text-zinc-400 hover:text-amber-300'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>

                {tierItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onClearTierRow(tier.id)}
                    aria-label={`Clear items in Tier ${plainAriaName}`}
                    title="Clear items in this tier"
                    className="p-1 text-zinc-400 hover:text-amber-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteTierRow(tier.id)}
                    aria-label={`Delete Tier ${plainAriaName}`}
                    title="Delete tier row"
                    className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onMoveTierRow(tier.id, 'down')}
                  disabled={idx === tiers.length - 1}
                  aria-label={`Move Tier ${plainAriaName} down`}
                  className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-25 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Advanced Tier Color & Label Popover */}
                {openColorPickerTierId === tier.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-24 top-1 z-40 w-72 bg-zinc-950 border border-zinc-700 rounded-lg p-3 shadow-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                      <span className="text-xs font-bold text-zinc-200">
                        Customize Tier Color &amp; Label
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenColorPickerTierId(null)}
                        aria-label="Close tier customization popover"
                        className="text-zinc-400 hover:text-zinc-100 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Preset Swatches */}
                    <div>
                      <div className="text-[11px] text-zinc-400 mb-1.5">Preset Swatches</div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {TIER_PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              onUpdateTier(tier.id, { color: c });
                              setCustomHexDraft(c);
                            }}
                            aria-label={`Select color ${c}`}
                            style={{ backgroundColor: c }}
                            className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                              tier.color.toLowerCase() === c.toLowerCase()
                                ? 'border-white ring-2 ring-amber-400/60'
                                : 'border-zinc-900'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Custom Hex Input + Color Wheel */}
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Custom Hex Color Code
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          aria-label={`Color picker for Tier ${plainAriaName}`}
                          value={normalizeHexColor(tier.color) || '#f87171'}
                          onChange={(e) => {
                            onUpdateTier(tier.id, { color: e.target.value });
                            setCustomHexDraft(e.target.value);
                          }}
                          className="w-8 h-8 rounded bg-zinc-900 border border-zinc-700 cursor-pointer shrink-0 p-0.5"
                        />
                        <input
                          type="text"
                          value={customHexDraft}
                          aria-label="Custom hex color code"
                          placeholder="#RRGGBB"
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomHexDraft(val);
                            const norm = normalizeHexColor(val);
                            if (norm) {
                              onUpdateTier(tier.id, { color: norm });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleApplyCustomHex(tier.id, customHexDraft);
                            }
                          }}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCustomHex(tier.id, customHexDraft)}
                          aria-label="Apply custom hex color"
                          className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Set</span>
                        </button>
                      </div>
                    </div>

                    {/* Multi-line Markdown Label Editor inside Popover */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-zinc-400">
                          Tier Name (Multi-line &amp; Markdown)
                        </label>
                      </div>
                      <textarea
                        rows={3}
                        value={tier.label}
                        aria-label={`Edit Tier ${plainAriaName} markdown label`}
                        onChange={(e) => onUpdateTier(tier.id, { label: e.target.value })}
                        placeholder="e.g. **S Tier**&#10;-#Top favorites"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 resize-y"
                      />
                      <div className="mt-1 text-[10px] text-zinc-400 leading-relaxed">
                        Supports <code className="text-zinc-300">**bold**</code>,{' '}
                        <code className="text-zinc-300">*italics*</code>,{' '}
                        <code className="text-zinc-300">_underline_</code>,{' '}
                        <code className="text-zinc-300">-#subtext</code>, and Enter for new lines.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Tier Row Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={onAddTierRow}
          className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Add Tier Row</span>
        </button>
        <span className="text-xs text-zinc-400">
          Tip: Click any tier label to add multiple lines or markdown (<code className="text-zinc-300">**bold**</code>, <code className="text-zinc-300">*italics*</code>, <code className="text-zinc-300">_underline_</code>, <code className="text-zinc-300">-#subtext</code>), or click the palette icon for custom hex colors.
        </span>
      </div>
    </section>
  );
};
