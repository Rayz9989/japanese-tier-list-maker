import React, { useState } from 'react';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  RotateCcw,
  Palette,
} from 'lucide-react';
import { CharacterItem, TierRow } from '../types/characters';
import { CharacterSvgCard } from './CharacterSvgCard';

export interface TierBoardProps {
  tiers: TierRow[];
  itemMap: Map<string, CharacterItem>;
  cardSize: number;
  cardTheme: 'dark' | 'light';
  bottomZoneMode: 'romaji' | 'kana';
  underlineStandaloneKun: boolean;
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
];

export const TierBoard: React.FC<TierBoardProps> = ({
  tiers,
  itemMap,
  cardSize,
  cardTheme,
  bottomZoneMode,
  underlineStandaloneKun,
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: CharacterItem) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
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
                    : '52px',
              }}
            >
              {/* Left Tier Header Block */}
              <div
                style={{ backgroundColor: tier.color }}
                className="w-24 sm:w-28 shrink-0 rounded-l-[7px] flex flex-col items-center justify-center p-1.5 text-zinc-950 relative"
              >
                <input
                  type="text"
                  value={tier.label}
                  aria-label={`Tier ${tier.label} name`}
                  onChange={(e) => onUpdateTier(tier.id, { label: e.target.value })}
                  className="w-full bg-transparent text-center font-bold text-lg sm:text-xl leading-tight text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950/40 rounded px-1"
                />
                <span className="text-[10px] font-bold text-zinc-950/75 tabular-nums">
                  {tierItems.length} {tierItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Center Tier Drop Zone */}
              <div className="flex-1 p-1.5 flex flex-wrap items-center gap-2 min-w-0">
                {tierItems.length === 0 ? (
                  <div className="w-full h-full min-h-[38px] flex items-center justify-center text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-md px-3">
                    Drag characters here or click any card below to inspect &amp; assign to Tier {tier.label}
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
                  aria-label={`Move Tier ${tier.label} up`}
                  className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-25 transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setOpenColorPickerTierId(
                      openColorPickerTierId === tier.id ? null : tier.id
                    )
                  }
                  aria-label={`Change Tier ${tier.label} color`}
                  className="p-1 text-zinc-400 hover:text-amber-300 transition-colors"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>

                {tierItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onClearTierRow(tier.id)}
                    aria-label={`Clear items in Tier ${tier.label}`}
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
                    aria-label={`Delete Tier ${tier.label}`}
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
                  aria-label={`Move Tier ${tier.label} down`}
                  className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-25 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Color Popover */}
                {openColorPickerTierId === tier.id && (
                  <div className="absolute right-11 top-1 z-30 bg-zinc-950 border border-zinc-700 rounded-md p-2 shadow-xl flex items-center gap-1.5">
                    {TIER_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          onUpdateTier(tier.id, { color: c });
                          setOpenColorPickerTierId(null);
                        }}
                        aria-label={`Select color ${c}`}
                        style={{ backgroundColor: c }}
                        className="w-5 h-5 rounded-sm border border-zinc-900 hover:scale-110 transition-transform"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Tier Row Button */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onAddTierRow}
          className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Add Tier Row</span>
        </button>
        <span className="text-xs text-zinc-400">
          Tip: Drag any card into a tier row, or click a card to open the Character Inspector &amp; quick-assign.
        </span>
      </div>
    </section>
  );
};
