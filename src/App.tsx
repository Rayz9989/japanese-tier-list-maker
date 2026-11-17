/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sun,
  Moon,
  Download,
  Upload,
  Image as ImageIcon,
  FileCode2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Underline,
  Languages,
  Columns2,
} from 'lucide-react';
import {
  CharacterItem,
  DoubleWidthMode,
  KangxiRadical,
  RankingTab,
  SortMode,
  TabFilterState,
  TierRow,
} from './types/characters';
import { ALL_KANJI_GROUP_IDS } from './data/kanjiClassification';
import {
  loadInitialCatalog,
  syncMissingWiktionaryYotsugana,
} from './services/dataLoader';
import { detectUnsupportedGlyphIds } from './data/kanaAndSymbols';
import {
  createDefaultFilterState,
  filterAndSortCharacters,
  partitionPoolByClassificationTier,
} from './utils/filterAndSort';
import { generateRandomSeed } from './utils/prng';
import {
  buildTierBoardSvgString,
  downloadTextFile,
  downloadTierBoardPng,
} from './utils/exportBoard';
import { MultiTabBar } from './components/MultiTabBar';
import { TierBoard } from './components/TierBoard';
import { FilterAndSortBar } from './components/FilterAndSortBar';
import { CharacterSvgCard } from './components/CharacterSvgCard';
import { CharacterInspectorDrawer } from './components/CharacterInspectorDrawer';

const STORAGE_KEY = 'kanji_kana_tier_maker_workspace_v1';
const CARDS_PER_PAGE = 120;
const INITIAL_CARDS_PER_GROUP = 48;
const GROUP_LOAD_MORE_STEP = 96;

function createDefaultTiers(): TierRow[] {
  return [
    { id: 'tier_s', label: 'S', color: '#f87171', itemIds: [] },
    { id: 'tier_a', label: 'A', color: '#fb923c', itemIds: [] },
    { id: 'tier_b', label: 'B', color: '#fbbf24', itemIds: [] },
    { id: 'tier_c', label: 'C', color: '#facc15', itemIds: [] },
    { id: 'tier_d', label: 'D', color: '#a3e635', itemIds: [] },
    { id: 'tier_e', label: 'E', color: '#38bdf8', itemIds: [] },
    { id: 'tier_f', label: 'F', color: '#c084fc', itemIds: [] },
  ];
}

function createNewRankingTab(name: string, seed?: string): RankingTab {
  return {
    id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    tiers: createDefaultTiers(),
    filters: createDefaultFilterState(),
    sortMode: 'random',
    sortDesc: false,
    seed: seed || 'sakura-2026',
    groupByTier: false,
    createdAt: Date.now(),
  };
}

interface PersistedWorkspaceState {
  tabs: RankingTab[];
  activeTabId: string;
  cardTheme: 'dark' | 'light';
  cardSize: number;
  bottomZoneMode: 'romaji' | 'kana';
  underlineStandaloneKun: boolean;
  doubleWidthMode: DoubleWidthMode;
}

function normalizeLoadedTab(tab: RankingTab): RankingTab {
  const f = tab.filters || createDefaultFilterState();
  return {
    ...tab,
    groupByTier: Boolean(tab.groupByTier),
    filters: {
      ...createDefaultFilterState(),
      ...f,
      includeHyogai: f.includeHyogai !== false,
      maxStrokes: Math.max(30, f.maxStrokes || 35),
      enabledKanjiGroups: Array.isArray(f.enabledKanjiGroups)
        ? f.enabledKanjiGroups
        : [...ALL_KANJI_GROUP_IDS],
    },
  };
}

function loadPersistedWorkspace(): PersistedWorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceState>;
      if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
        const dw =
          parsed.doubleWidthMode === 'off' || parsed.doubleWidthMode === 'always'
            ? parsed.doubleWidthMode
            : 'auto';
        const migratedTabs = parsed.tabs.map(normalizeLoadedTab);
        return {
          tabs: migratedTabs,
          activeTabId: parsed.activeTabId || migratedTabs[0].id,
          cardTheme: parsed.cardTheme === 'light' ? 'light' : 'dark',
          cardSize:
            typeof parsed.cardSize === 'number'
              ? Math.max(72, Math.min(180, parsed.cardSize))
              : 104,
          bottomZoneMode: parsed.bottomZoneMode === 'kana' ? 'kana' : 'romaji',
          underlineStandaloneKun: Boolean(parsed.underlineStandaloneKun),
          doubleWidthMode: dw,
        };
      }
    }
  } catch {
    // Ignore corrupt localStorage
  }

  const initialTab = createNewRankingTab('Main Ranking', 'sakura-2026');
  return {
    tabs: [initialTab],
    activeTabId: initialTab.id,
    cardTheme: 'dark',
    cardSize: 104,
    bottomZoneMode: 'romaji',
    underlineStandaloneKun: false,
    doubleWidthMode: 'auto',
  };
}

export default function App() {
  const initialWorkspace = useMemo(() => loadPersistedWorkspace(), []);

  const [tabs, setTabs] = useState<RankingTab[]>(initialWorkspace.tabs);
  const [activeTabId, setActiveTabId] = useState<string>(
    initialWorkspace.activeTabId
  );
  const [cardTheme, setCardTheme] = useState<'dark' | 'light'>(
    initialWorkspace.cardTheme
  );
  const [cardSize, setCardSize] = useState<number>(initialWorkspace.cardSize);
  const [bottomZoneMode, setBottomZoneMode] = useState<'romaji' | 'kana'>(
    initialWorkspace.bottomZoneMode
  );
  const [underlineStandaloneKun, setUnderlineStandaloneKun] = useState<boolean>(
    initialWorkspace.underlineStandaloneKun
  );
  const [doubleWidthMode, setDoubleWidthMode] = useState<DoubleWidthMode>(
    initialWorkspace.doubleWidthMode
  );

  const [catalogItems, setCatalogItems] = useState<CharacterItem[]>([]);
  const [radicals, setRadicals] = useState<KangxiRadical[]>([]);
  const [unsupportedIds, setUnsupportedIds] = useState<Set<string>>(new Set());
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [collapsedSectionKeys, setCollapsedSectionKeys] = useState<Record<string, boolean>>({});
  const [sectionVisibleLimits, setSectionVisibleLimits] = useState<Record<string, number>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-save workspace to localStorage
  useEffect(() => {
    try {
      const state: PersistedWorkspaceState = {
        tabs,
        activeTabId,
        cardTheme,
        cardSize,
        bottomZoneMode,
        underlineStandaloneKun,
        doubleWidthMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    tabs,
    activeTabId,
    cardTheme,
    cardSize,
    bottomZoneMode,
    underlineStandaloneKun,
    doubleWidthMode,
  ]);

  // Load initial catalog + run Tofu Detector + sync Wiktionary yotsugana
  useEffect(() => {
    let cancelled = false;
    loadInitialCatalog()
      .then(async ({ items, radicals: radList, rawSeedKanji }) => {
        if (cancelled) return;
        setCatalogItems(items);
        setRadicals(radList);
        setIsLoadingCatalog(false);

        const badIds = await detectUnsupportedGlyphIds(items);
        if (!cancelled) {
          setUnsupportedIds(badIds);
        }

        const radMap = new Map<number, KangxiRadical>();
        for (const r of radList) radMap.set(r.num, r);

        syncMissingWiktionaryYotsugana(rawSeedKanji, radMap, (updatedMap) => {
          if (cancelled) return;
          setCatalogItems((prev) =>
            prev.map((it) => updatedMap.get(it.id) ?? it)
          );
        }).catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setIsLoadingCatalog(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const itemMap = useMemo(() => {
    const m = new Map<string, CharacterItem>();
    for (const it of catalogItems) {
      m.set(it.id, it);
    }
    return m;
  }, [catalogItems]);

  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  const rankedItemIdsInActiveTab = useMemo(() => {
    const s = new Set<string>();
    if (activeTab) {
      for (const tier of activeTab.tiers) {
        for (const id of tier.itemIds) {
          s.add(id);
        }
      }
    }
    return s;
  }, [activeTab]);

  // Reset pagination to page 1 and section limits when filters or active tab change
  useEffect(() => {
    setCurrentPage(1);
    setSectionVisibleLimits({});
  }, [
    activeTabId,
    activeTab?.filters,
    activeTab?.sortMode,
    activeTab?.sortDesc,
    activeTab?.seed,
    activeTab?.groupByTier,
  ]);

  const filteredPool = useMemo(() => {
    if (!activeTab) return [];
    return filterAndSortCharacters(
      catalogItems,
      rankedItemIdsInActiveTab,
      unsupportedIds,
      activeTab.filters,
      activeTab.sortMode,
      activeTab.sortDesc,
      activeTab.seed
    );
  }, [catalogItems, rankedItemIdsInActiveTab, unsupportedIds, activeTab]);

  const groupedSections = useMemo(() => {
    if (!activeTab?.groupByTier) return [];
    return partitionPoolByClassificationTier(filteredPool);
  }, [activeTab?.groupByTier, filteredPool]);

  const totalSupportedCount = useMemo(() => {
    let count = 0;
    for (const it of catalogItems) {
      if (!unsupportedIds.has(it.id)) count++;
    }
    return count;
  }, [catalogItems, unsupportedIds]);

  const totalPages = Math.max(1, Math.ceil(filteredPool.length / CARDS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPool = useMemo(() => {
    const start = (safePage - 1) * CARDS_PER_PAGE;
    return filteredPool.slice(start, start + CARDS_PER_PAGE);
  }, [filteredPool, safePage]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return itemMap.get(selectedItemId) ?? null;
  }, [selectedItemId, itemMap]);

  const selectedItemTierId = useMemo(() => {
    if (!selectedItemId || !activeTab) return null;
    for (const t of activeTab.tiers) {
      if (t.itemIds.includes(selectedItemId)) return t.id;
    }
    return null;
  }, [selectedItemId, activeTab]);

  // Helper to update the active tab
  const updateActiveTab = (updater: (tab: RankingTab) => RankingTab) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? updater(t) : t))
    );
  };

  // Multi-Tab Actions
  const handleCreateTab = () => {
    const nextTab = createNewRankingTab(
      `Ranking ${tabs.length + 1}`,
      generateRandomSeed()
    );
    setTabs((prev) => [...prev, nextTab]);
    setActiveTabId(nextTab.id);
  };

  const handleRenameTab = (tabId: string, newName: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, name: newName } : t))
    );
  };

  const handleDuplicateTab = (tabId: string) => {
    const source = tabs.find((t) => t.id === tabId);
    if (!source) return;
    const copy: RankingTab = {
      ...JSON.parse(JSON.stringify(source)),
      id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${source.name} (Copy)`,
      createdAt: Date.now(),
    };
    setTabs((prev) => [...prev, copy]);
    setActiveTabId(copy.id);
  };

  const handleMoveTab = (tabId: string, direction: 'left' | 'right') => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy;
    });
  };

  const handleDeleteTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    const nextTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(nextTabs);
    if (activeTabId === tabId) {
      setActiveTabId(nextTabs[0].id);
    }
  };

  // Tier Board Actions
  const handleAssignItemToTier = (itemId: string, targetTierId: string | null) => {
    updateActiveTab((tab) => {
      const nextTiers = tab.tiers.map((tier) => {
        const without = tier.itemIds.filter((id) => id !== itemId);
        if (tier.id === targetTierId) {
          return { ...tier, itemIds: [...without, itemId] };
        }
        return { ...tier, itemIds: without };
      });
      return { ...tab, tiers: nextTiers };
    });
  };

  const handleUpdateTier = (
    tierId: string,
    patch: Partial<Pick<TierRow, 'label' | 'color'>>
  ) => {
    updateActiveTab((tab) => ({
      ...tab,
      tiers: tab.tiers.map((t) => (t.id === tierId ? { ...t, ...patch } : t)),
    }));
  };

  const handleMoveTierRow = (tierId: string, direction: 'up' | 'down') => {
    updateActiveTab((tab) => {
      const idx = tab.tiers.findIndex((t) => t.id === tierId);
      if (idx === -1) return tab;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= tab.tiers.length) return tab;
      const next = [...tab.tiers];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return { ...tab, tiers: next };
    });
  };

  const handleAddTierRow = () => {
    updateActiveTab((tab) => {
      const newTier: TierRow = {
        id: `tier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: `T${tab.tiers.length + 1}`,
        color: '#34d399',
        itemIds: [],
      };
      return { ...tab, tiers: [...tab.tiers, newTier] };
    });
  };

  const handleClearTierRow = (tierId: string) => {
    updateActiveTab((tab) => ({
      ...tab,
      tiers: tab.tiers.map((t) =>
        t.id === tierId ? { ...t, itemIds: [] } : t
      ),
    }));
  };

  const handleDeleteTierRow = (tierId: string) => {
    updateActiveTab((tab) => {
      if (tab.tiers.length <= 1) return tab;
      return {
        ...tab,
        tiers: tab.tiers.filter((t) => t.id !== tierId),
      };
    });
  };

  // Filter & Sort Actions
  const handleChangeFilters = (nextFilters: TabFilterState) => {
    updateActiveTab((tab) => ({ ...tab, filters: nextFilters }));
  };

  const handleChangeSortMode = (sortMode: SortMode) => {
    updateActiveTab((tab) => ({ ...tab, sortMode }));
  };

  const handleToggleSortDesc = () => {
    updateActiveTab((tab) => ({ ...tab, sortDesc: !tab.sortDesc }));
  };

  const handleChangeSeed = (seed: string) => {
    updateActiveTab((tab) => ({ ...tab, seed }));
  };

  const handleNewRandomSeed = () => {
    const nextSeed = generateRandomSeed();
    updateActiveTab((tab) => ({
      ...tab,
      sortMode: 'random',
      seed: nextSeed,
    }));
  };

  const handleToggleGroupByTier = () => {
    updateActiveTab((tab) => ({
      ...tab,
      groupByTier: !tab.groupByTier,
    }));
  };

  // Export / Import Handlers
  const showBannerMessage = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleExportAllTabsJson = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      cardTheme,
      cardSize,
      bottomZoneMode,
      underlineStandaloneKun,
      tabs,
    };
    downloadTextFile(
      'kanji-kana-tier-all-tabs.json',
      JSON.stringify(payload, null, 2),
      'application/json'
    );
    showBannerMessage('Exported all tabs to JSON.');
  };

  const handleExportCurrentTabJson = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tab: activeTab,
    };
    const safeName = activeTab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadTextFile(
      `${safeName || 'tab'}-tier-list.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
    showBannerMessage(`Exported "${activeTab.name}" to JSON.`);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.tabs) && data.tabs.length > 0) {
          setTabs(data.tabs);
          setActiveTabId(data.tabs[0].id);
          if (data.cardTheme === 'light' || data.cardTheme === 'dark') {
            setCardTheme(data.cardTheme);
          }
          showBannerMessage(`Imported ${data.tabs.length} tab(s) from JSON.`);
        } else if (data.tab && Array.isArray(data.tab.tiers)) {
          const importedTab: RankingTab = {
            ...data.tab,
            id: `tab_${Date.now()}`,
          };
          setTabs((prev) => [...prev, importedTab]);
          setActiveTabId(importedTab.id);
          showBannerMessage(`Imported tab "${importedTab.name}".`);
        } else {
          showBannerMessage('Invalid JSON tier list file format.');
        }
      } catch {
        showBannerMessage('Failed to parse JSON file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportBoardSvg = () => {
    const svg = buildTierBoardSvgString(
      activeTab,
      itemMap,
      cardTheme,
      bottomZoneMode,
      underlineStandaloneKun,
      doubleWidthMode
    );
    const safeName = activeTab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadTextFile(`${safeName || 'board'}-tier-board.svg`, svg, 'image/svg+xml');
    showBannerMessage('Exported Tier Board SVG.');
  };

  const handleExportBoardPng = async () => {
    await downloadTierBoardPng(
      activeTab,
      itemMap,
      cardTheme,
      bottomZoneMode,
      underlineStandaloneKun,
      doubleWidthMode
    );
    showBannerMessage('Exported Tier Board PNG.');
  };

  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col"
      style={{ fontFamily: "'Andika', sans-serif" }}
    >
      {/* Top Bar Contract: Zone 1 Brand Wordmark — Zone 2 Quick Category Jump — Zone 3 Primary Export CTA */}
      <header className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 bg-zinc-950 border-b border-zinc-800">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-zinc-100 whitespace-nowrap shrink-0"
        >
          Kanji &amp; Kana Tier Maker
        </a>

        <nav
          aria-label="Quick Corpus Views"
          className="hidden md:flex items-center gap-6 text-xs font-bold text-zinc-400"
        >
          <a
            href="#tier-board-section"
            className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Tier Board
          </a>
          <a
            href="#character-pool-section"
            className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Character Pool ({totalSupportedCount.toLocaleString()})
          </a>
          <button
            type="button"
            onClick={() =>
              handleChangeFilters({
                ...createDefaultFilterState(),
                onlyYotsugana: !activeTab.filters.onlyYotsugana,
              })
            }
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 ${
              activeTab.filters.onlyYotsugana ? 'text-amber-400 underline' : ''
            }`}
          >
            4-Way Yotsugana (ぢ/づ)
          </button>
          <button
            type="button"
            onClick={() => {
              const firstKanji =
                catalogItems.find((c) => c.char === '重') || catalogItems[0];
              if (firstKanji) setSelectedItemId(firstKanji.id);
            }}
            className="hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            Character Inspector
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportBoardPng}
            className="px-3.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Export Tier Board (PNG)</span>
          </button>
        </div>
      </header>

      {/* Multi-Tab Bar */}
      <MultiTabBar
        tabs={tabs}
        activeTabId={activeTab.id}
        onSelectTab={setActiveTabId}
        onCreateTab={handleCreateTab}
        onRenameTab={handleRenameTab}
        onDuplicateTab={handleDuplicateTab}
        onMoveTab={handleMoveTab}
        onDeleteTab={handleDeleteTab}
      />

      {/* Workspace Display & Export Toolbar */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Independent Card Theme Toggle, Card Size Slider, Bottom-Zone Mode, Root Underlining */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Independent Card Theme Toggle (Dark Cards vs Light Cards) */}
          <button
            type="button"
            onClick={() =>
              setCardTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
            }
            aria-label={`Switch Card Theme (currently ${
              cardTheme === 'dark' ? 'Dark Cards' : 'Light Cards'
            })`}
            className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            {cardTheme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Card Theme: Dark Cards</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Card Theme: Light Cards</span>
              </>
            )}
          </button>

          {/* Global Card Size Slider (72px to 180px) */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1">
            <label
              htmlFor="card-size-slider"
              className="text-zinc-300 font-bold whitespace-nowrap"
            >
              Card Size: <span className="tabular-nums text-amber-300">{cardSize}px</span>
            </label>
            <input
              id="card-size-slider"
              type="range"
              min={72}
              max={180}
              step={4}
              value={cardSize}
              onChange={(e) => setCardSize(Number(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Bottom-Zone Script Toggle (Custom Romaji vs Kana) */}
          <button
            type="button"
            onClick={() =>
              setBottomZoneMode((m) => (m === 'romaji' ? 'kana' : 'romaji'))
            }
            aria-label={`Bottom Zone Script: ${
              bottomZoneMode === 'romaji' ? 'Custom Romaji' : 'Kana'
            }`}
            className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Bottom Zone: {bottomZoneMode === 'romaji' ? 'Custom Romaji' : 'Kana (ぢ/づ)'}
            </span>
          </button>

          {/* Optional Toggle: Underline Standalone Kun Roots */}
          <button
            type="button"
            onClick={() => setUnderlineStandaloneKun((v) => !v)}
            aria-pressed={underlineStandaloneKun}
            title="Default: underline kanji root only when okurigana follows. Toggle to also underline standalone kun roots."
            className={`px-2.5 py-1.5 rounded-md border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              underlineStandaloneKun
                ? 'bg-zinc-800 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Underline className="w-3.5 h-3.5" />
            <span>
              {underlineStandaloneKun
                ? 'Underline: All Kun Roots'
                : 'Underline: Roots w/ Okurigana'}
            </span>
          </button>

          {/* 3-Way Toggle for Double Width Tier Label Boxes (Auto / Off / Always) */}
          <div
            role="group"
            aria-label="2x Tier Label Width Mode"
            className="inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5 gap-0.5 shrink-0"
          >
            <span className="px-2 py-1 text-zinc-400 inline-flex items-center gap-1 whitespace-nowrap">
              <Columns2 className="w-3.5 h-3.5 text-amber-400" />
              <span>2x Tier Labels:</span>
            </span>
            {(['auto', 'off', 'always'] as const).map((modeOption) => {
              const isSelectedMode = doubleWidthMode === modeOption;
              const labelText =
                modeOption === 'auto'
                  ? 'Auto'
                  : modeOption === 'off'
                  ? 'Off'
                  : 'Always';
              return (
                <button
                  key={modeOption}
                  type="button"
                  onClick={() => setDoubleWidthMode(modeOption)}
                  aria-pressed={isSelectedMode}
                  aria-label={`2x Tier Labels: ${labelText}`}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap ${
                    isSelectedMode
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
                >
                  {labelText}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: JSON & SVG Export/Import Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {statusMessage && (
            <span className="text-amber-300 font-bold px-2">{statusMessage}</span>
          )}

          <button
            type="button"
            onClick={handleExportBoardSvg}
            className="px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Board (SVG)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCurrentTabJson}
            className="px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export Tab (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleExportAllTabsJson}
            className="px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export All Tabs (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportJsonFile}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main
        className={`flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4 transition-all ${
          selectedItem ? 'xl:pr-[464px]' : ''
        }`}
      >
        {/* Tier Board Section */}
        <div id="tier-board-section">
          <TierBoard
            tiers={activeTab.tiers}
            itemMap={itemMap}
            cardSize={cardSize}
            cardTheme={cardTheme}
            bottomZoneMode={bottomZoneMode}
            underlineStandaloneKun={underlineStandaloneKun}
            doubleWidthMode={doubleWidthMode}
            selectedItemId={selectedItemId}
            onSelectItem={(it) => setSelectedItemId(it.id)}
            onDropItemToTier={(itemId, tierId) =>
              handleAssignItemToTier(itemId, tierId)
            }
            onRemoveItemFromTier={(itemId) =>
              handleAssignItemToTier(itemId, null)
            }
            onUpdateTier={handleUpdateTier}
            onMoveTierRow={handleMoveTierRow}
            onAddTierRow={handleAddTierRow}
            onClearTierRow={handleClearTierRow}
            onDeleteTierRow={handleDeleteTierRow}
          />
        </div>

        {/* Granular Filter & Sort Bar */}
        <div id="character-pool-section" className="space-y-4">
          <FilterAndSortBar
            filters={activeTab.filters}
            onChangeFilters={handleChangeFilters}
            sortMode={activeTab.sortMode}
            onChangeSortMode={handleChangeSortMode}
            sortDesc={activeTab.sortDesc}
            onToggleSortDesc={handleToggleSortDesc}
            seed={activeTab.seed}
            onChangeSeed={handleChangeSeed}
            onNewRandomSeed={handleNewRandomSeed}
            groupByTier={Boolean(activeTab.groupByTier)}
            onToggleGroupByTier={handleToggleGroupByTier}
            radicals={radicals}
            filteredCount={filteredPool.length}
            totalPoolCount={totalSupportedCount - rankedItemIdsInActiveTab.size}
          />

          {/* Unranked Character Pool (Unified Paginated Grid OR Grouped 1–19 Tier Sections) */}
          <section
            aria-label="Unranked Character Pool"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const droppedId = e.dataTransfer.getData('text/plain');
              if (droppedId) {
                handleAssignItemToTier(droppedId, null);
              }
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4"
          >
            {/* Pool Header & Pagination / Group Collapse Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="text-xs text-zinc-300">
                <span className="font-bold text-zinc-100">Unranked Character Pool</span>
                <span className="mx-2 text-zinc-600">·</span>
                <span className="tabular-nums">
                  {filteredPool.length === 0
                    ? '0 matching characters'
                    : activeTab.groupByTier
                    ? `${filteredPool.length.toLocaleString()} characters across ${groupedSections.length} tier section${
                        groupedSections.length === 1 ? '' : 's'
                      }`
                    : `Showing ${(safePage - 1) * CARDS_PER_PAGE + 1}–${Math.min(
                        safePage * CARDS_PER_PAGE,
                        filteredPool.length
                      )} of ${filteredPool.length.toLocaleString()}`}
                </span>
              </div>

              {activeTab.groupByTier ? (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCollapsedSectionKeys({})}
                    className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 whitespace-nowrap"
                  >
                    Expand All Tiers
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next: Record<string, boolean> = {};
                      for (const sec of groupedSections) next[sec.key] = true;
                      setCollapsedSectionKeys(next);
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 whitespace-nowrap"
                  >
                    Collapse All Tiers
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    aria-label="Previous page"
                    className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                  <span className="px-2.5 py-1 text-zinc-300 tabular-nums">
                    Page <strong className="text-zinc-100">{safePage}</strong> of{' '}
                    <strong className="text-zinc-100">{totalPages}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safePage >= totalPages}
                    aria-label="Next page"
                    className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Cards Content: Loading / Empty / Grouped 1–19 Sections / Unified Paginated Grid */}
            {isLoadingCatalog ? (
              <div className="py-16 text-center text-sm text-zinc-400">
                Loading 3,670+ Jōyō, Jinmeiyō &amp; Qualifying Hyōgai Kanji, Kana, Ligatures, and Symbols...
              </div>
            ) : filteredPool.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <p className="text-sm text-zinc-400">
                  No unranked characters match the current filters or search query.
                </p>
                <button
                  type="button"
                  onClick={() => handleChangeFilters(createDefaultFilterState())}
                  className="px-4 py-2 rounded-md bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 transition-colors"
                >
                  Reset Active Filters
                </button>
              </div>
            ) : activeTab.groupByTier ? (
              <div className="space-y-4" data-testid="grouped-pool-sections">
                {groupedSections.map((sec) => {
                  const isCollapsed = Boolean(collapsedSectionKeys[sec.key]);
                  const limit =
                    sectionVisibleLimits[sec.key] ?? INITIAL_CARDS_PER_GROUP;
                  const visibleItems = sec.items.slice(0, limit);
                  const remainingCount = sec.items.length - visibleItems.length;

                  return (
                    <div
                      key={sec.key}
                      className="border-b border-zinc-800/80 pb-4 last:border-b-0 last:pb-0 space-y-3"
                    >
                      <button
                        type="button"
                        aria-expanded={!isCollapsed}
                        onClick={() =>
                          setCollapsedSectionKeys((prev) => ({
                            ...prev,
                            [sec.key]: !prev[sec.key],
                          }))
                        }
                        className="w-full flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800/90 text-left transition-colors"
                      >
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 min-w-0">
                          <ChevronDown
                            className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-150 ${
                              isCollapsed ? '-rotate-90' : ''
                            }`}
                          />
                          <span className={`text-sm font-bold tabular-nums ${sec.accentTextClass}`}>
                            {sec.title} ({sec.items.length.toLocaleString()})
                          </span>
                          <span className="hidden sm:inline text-xs text-zinc-500">·</span>
                          <span className="hidden sm:inline text-xs text-zinc-400 truncate">
                            {sec.subtitle}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 whitespace-nowrap shrink-0">
                          {isCollapsed ? 'Expand' : 'Collapse'}
                        </span>
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-3 pl-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {visibleItems.map((item) => (
                              <CharacterSvgCard
                                key={item.id}
                                item={item}
                                cardSize={cardSize}
                                cardTheme={cardTheme}
                                bottomZoneMode={bottomZoneMode}
                                underlineStandaloneKun={underlineStandaloneKun}
                                isSelected={selectedItemId === item.id}
                                onSelect={(it) => setSelectedItemId(it.id)}
                                onDragStart={(e, it) => {
                                  e.dataTransfer.setData('text/plain', it.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                              />
                            ))}
                          </div>

                          {remainingCount > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                              <button
                                type="button"
                                onClick={() =>
                                  setSectionVisibleLimits((prev) => ({
                                    ...prev,
                                    [sec.key]: limit + GROUP_LOAD_MORE_STEP,
                                  }))
                                }
                                className="px-3 py-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold tabular-nums transition-colors"
                              >
                                Show {Math.min(GROUP_LOAD_MORE_STEP, remainingCount)} more in{' '}
                                {sec.title}
                              </button>
                              {remainingCount > GROUP_LOAD_MORE_STEP && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSectionVisibleLimits((prev) => ({
                                      ...prev,
                                      [sec.key]: sec.items.length,
                                    }))
                                  }
                                  className="px-3 py-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 tabular-nums transition-colors"
                                >
                                  Show all {sec.items.length.toLocaleString()}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5">
                {paginatedPool.map((item) => (
                  <CharacterSvgCard
                    key={item.id}
                    item={item}
                    cardSize={cardSize}
                    cardTheme={cardTheme}
                    bottomZoneMode={bottomZoneMode}
                    underlineStandaloneKun={underlineStandaloneKun}
                    isSelected={selectedItemId === item.id}
                    onSelect={(it) => setSelectedItemId(it.id)}
                    onDragStart={(e, it) => {
                      e.dataTransfer.setData('text/plain', it.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  />
                ))}
              </div>
            )}

            {/* Bottom Pagination Controls (Unified Mode Only) */}
            {!activeTab.groupByTier && totalPages > 1 && (
              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage <= 1}
                  className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                >
                  First
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-2.5 py-1 text-zinc-300 tabular-nums">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                >
                  Last
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Character Inspector Drawer */}
      <CharacterInspectorDrawer
        item={selectedItem}
        onClose={() => setSelectedItemId(null)}
        tiers={activeTab.tiers}
        currentTierId={selectedItemTierId}
        onAssignTier={handleAssignItemToTier}
        cardTheme={cardTheme}
        bottomZoneMode={bottomZoneMode}
        underlineStandaloneKun={underlineStandaloneKun}
      />
    </div>
  );
}
