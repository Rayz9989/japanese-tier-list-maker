import React, { useState } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
} from 'lucide-react';
import { RankingTab } from '../types/characters';

export interface MultiTabBarProps {
  tabs: RankingTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCreateTab: () => void;
  onRenameTab: (tabId: string, newName: string) => void;
  onDuplicateTab: (tabId: string) => void;
  onMoveTab: (tabId: string, direction: 'left' | 'right') => void;
  onDeleteTab: (tabId: string) => void;
}

export const MultiTabBar: React.FC<MultiTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCreateTab,
  onRenameTab,
  onDuplicateTab,
  onMoveTab,
  onDeleteTab,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const startRename = (tab: RankingTab) => {
    setEditingTabId(tab.id);
    setDraftName(tab.name);
  };

  const commitRename = (tabId: string) => {
    const trimmed = draftName.trim();
    if (trimmed) {
      onRenameTab(tabId, trimmed);
    }
    setEditingTabId(null);
  };

  return (
    <div
      role="tablist"
      aria-label="Ranking Workspace Tabs"
      className="flex items-center justify-between gap-3 bg-zinc-900/80 border-b border-zinc-800 px-4 sm:px-6 py-2 overflow-x-auto"
      style={{ fontFamily: "'Andika', sans-serif" }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTabId;
          const isEditing = editingTabId === tab.id;
          const rankedCount = tab.tiers.reduce((acc, t) => acc + t.itemIds.length, 0);

          return (
            <div
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors shrink-0 border ${
                isActive
                  ? 'bg-zinc-950 text-zinc-100 border-amber-500/60'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitRename(tab.id);
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => commitRename(tab.id)}
                    autoFocus
                    aria-label="Edit tab name"
                    className="w-28 bg-zinc-900 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Save tab name"
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectTab(tab.id)}
                  onDoubleClick={() => startRename(tab)}
                  className="font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-none"
                >
                  <span>{tab.name}</span>
                  <span className="text-[11px] font-normal text-zinc-400 tabular-nums">
                    ({rankedCount})
                  </span>
                </button>
              )}

              {/* Active Tab Actions: Rename, Reorder, Duplicate, Delete */}
              {isActive && !isEditing && (
                <div className="flex items-center gap-0.5 pl-1.5 ml-1 border-l border-zinc-800">
                  <button
                    type="button"
                    onClick={() => startRename(tab)}
                    aria-label={`Rename tab ${tab.name}`}
                    title="Rename tab"
                    className="p-0.5 text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveTab(tab.id, 'left')}
                    disabled={idx === 0}
                    aria-label={`Move tab ${tab.name} left`}
                    title="Move tab left"
                    className="p-0.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-25 transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveTab(tab.id, 'right')}
                    disabled={idx === tabs.length - 1}
                    aria-label={`Move tab ${tab.name} right`}
                    title="Move tab right"
                    className="p-0.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-25 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateTab(tab.id)}
                    aria-label={`Duplicate tab ${tab.name}`}
                    title="Duplicate tab"
                    className="p-0.5 text-zinc-400 hover:text-amber-300 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteTab(tab.id)}
                      aria-label={`Delete tab ${tab.name}`}
                      title="Delete tab"
                      className="p-0.5 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onCreateTab}
          className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-300 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Tab</span>
        </button>
      </div>
    </div>
  );
};
