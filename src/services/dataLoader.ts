import { CharacterItem, KangxiRadical } from '../types/characters';
import {
  deduplicateKanjiReadings,
  kanaToStandardRomaji,
  parseKanjiReading,
} from '../utils/romaji';
import {
  hasYotsuganaCandidate,
  parseWiktionaryJaReadings,
  resolveKanjiReadingYotsugana,
} from '../utils/yotsugana';
import { buildBuiltinKanaAndSymbols } from '../data/kanaAndSymbols';
import {
  classifyKanjiGroup,
  isQualifyingHyogaiKanji,
  JIS_LEVEL_1_SET,
  KANJI_GROUP_MAP,
  KANKEN_PRE1_SET,
} from '../data/kanjiClassification';
import { getKanjiVisualDecomposition } from '../data/kanjiDecomposition';

export interface RawSeedKanji {
  c: string;
  s: number;
  g: number;
  f: number | null;
  j: number;
  r: number;
  l?: number | null;
  m: string[];
  on: string[];
  kun: string[];
  wt?: string;
  rb?: number;
}

interface RawSeedPayload {
  radicals: KangxiRadical[];
  kanji: RawSeedKanji[];
}

interface KanjiApiDetailResponse {
  kanji: string;
  grade: number | null;
  stroke_count: number;
  meanings: string[];
  kun_readings: string[];
  on_readings: string[];
  jlpt: number | null;
  freq_mainichi_shinbun: number | null;
}

const IDB_NAME = 'kanji_tier_maker_db';
/** Incremented to v2 so stale v1 caches automatically invalidate and refresh with expanded Hyōgai data */
const IDB_VERSION = 2;
const LEGACY_IDB_STORE_V1 = 'wiktionary_yotsugana_v1';
const IDB_STORE_WIK_V2 = 'wiktionary_yotsugana_v2';
const IDB_STORE_KANJIAPI_V2 = 'kanjiapi_hydration_v2';

function openCatalogDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (db.objectStoreNames.contains(LEGACY_IDB_STORE_V1)) {
          db.deleteObjectStore(LEGACY_IDB_STORE_V1);
        }
        if (!db.objectStoreNames.contains(IDB_STORE_WIK_V2)) {
          db.createObjectStore(IDB_STORE_WIK_V2);
        }
        if (!db.objectStoreNames.contains(IDB_STORE_KANJIAPI_V2)) {
          db.createObjectStore(IDB_STORE_KANJIAPI_V2);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getIdbValue<T>(storeName: string, key: string, fallback: T): Promise<T> {
  const db = await openCatalogDB();
  if (!db) return fallback;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? fallback);
      req.onerror = () => resolve(fallback);
    } catch {
      resolve(fallback);
    }
  });
}

async function setIdbValue<T>(storeName: string, key: string, value: T): Promise<void> {
  const db = await openCatalogDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function katakanaToHiragana(str: string): string {
  return [...str]
    .map((ch) => {
      const cp = ch.codePointAt(0) ?? 0;
      return cp >= 0x30a1 && cp <= 0x30f6 ? String.fromCodePoint(cp - 0x60) : ch;
    })
    .join('');
}

/**
 * Extract English definitions from raw Wiktionary wikitext if kanjiapi.dev meanings are missing.
 */
export function extractWiktionaryMeanings(wikitext: string): string[] {
  if (!wikitext) return [];
  const meanings: string[] = [];
  const lines = wikitext.split('\n');
  for (const line of lines) {
    if (/^#\s+/.test(line) && !line.includes('{{rfdef')) {
      const cleaned = line
        .replace(/^#+\s*/, '')
        .replace(/\{\{[^}]+\}\}/g, '')
        .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, '$1')
        .replace(/''+/g, '')
        .replace(/;.*$/, '')
        .trim()
        .toLowerCase();
      if (cleaned && /^[a-z0-9\s\-',/()]+$/.test(cleaned) && cleaned.length <= 36) {
        meanings.push(cleaned);
        if (meanings.length >= 4) break;
      }
    }
  }
  return meanings;
}

export function buildKanjiCharacterItem(
  entry: RawSeedKanji,
  radicalMap: Map<number, KangxiRadical>,
  catalogOrder: number,
  overrideWikitext?: string,
  nfcLookup?: Map<string, RawSeedKanji>
): CharacterItem {
  const nfcChar = entry.c.normalize('NFC');
  const nfcFallback = nfcChar !== entry.c ? nfcLookup?.get(nfcChar) : undefined;

  const wikitext = overrideWikitext ?? entry.wt ?? nfcFallback?.wt ?? '';
  const wikPairs = wikitext ? parseWiktionaryJaReadings(wikitext) : undefined;

  const rawOnList =
    entry.on && entry.on.length > 0 ? entry.on : nfcFallback?.on || [];
  const rawKunList =
    entry.kun && entry.kun.length > 0 ? entry.kun : nfcFallback?.kun || [];

  const allOnReadings = rawOnList.map((raw) => {
    const resolved = resolveKanjiReadingYotsugana(entry.c, raw, wikPairs);
    return parseKanjiReading(raw, resolved, 'on');
  });

  const allKunReadings = rawKunList.map((raw) => {
    const resolved = resolveKanjiReadingYotsugana(entry.c, raw, wikPairs);
    return parseKanjiReading(raw, resolved, 'kun');
  });

  const { deduplicatedOn, deduplicatedKun, cardReadings } = deduplicateKanjiReadings(
    allOnReadings,
    allKunReadings,
    4
  );

  const baseMeanings =
    entry.m && entry.m.length > 0
      ? entry.m
      : nfcFallback?.m && nfcFallback.m.length > 0
      ? nfcFallback.m
      : extractWiktionaryMeanings(wikitext);

  const cleanMeanings = baseMeanings
    .map((m) => m.trim().toLowerCase())
    .filter((m) => Boolean(m) && m !== entry.c.toLowerCase());
  const middleText = cleanMeanings.slice(0, 3).join('/');

  const bottomText = cardReadings.map((r) => r.fullRomaji).join('/');
  const bottomKanaText = cardReadings.map((r) => r.fullKana).join('/');

  const radNum = entry.r || nfcFallback?.r || 1;
  const rad = radicalMap.get(radNum);
  const code = entry.c.codePointAt(0) ?? 0;
  const unicodeHex = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');

  const allRomaji = [...allOnReadings, ...allKunReadings].map((r) => r.fullRomaji).join(' ');
  const allStdRomaji = [...allOnReadings, ...allKunReadings]
    .map((r) => kanaToStandardRomaji(r.fullKana))
    .join(' ');
  const allKana = [...allOnReadings, ...allKunReadings].map((r) => r.fullKana).join(' ');

  const hasYotsuganaResolution = [...allOnReadings, ...allKunReadings].some((r) =>
    /[ぢづ]/.test(r.fullKana)
  );

  const isRadicalBase = Boolean(entry.rb || (rad && rad.glyph === entry.c));
  const radicalBaseNumber =
    entry.rb || (rad && rad.glyph === entry.c ? rad.num : undefined);
  const category =
    entry.j === 1
      ? 'joyo_kanji'
      : entry.j === 2
      ? 'hyogai_kanji'
      : 'jinmeiyo_kanji';

  const grade = entry.g === 0 ? null : entry.g;
  const jlpt = entry.l ?? nfcFallback?.l ?? null;
  const kanjiGroup = classifyKanjiGroup({
    char: entry.c,
    category,
    grade,
    jlpt,
  });
  const groupMeta = KANJI_GROUP_MAP.get(kanjiGroup);
  const visualFormula = getKanjiVisualDecomposition(entry.c).formula;

  return {
    id: `kanji_${entry.c}`,
    char: entry.c,
    category,
    middleText: middleText || (rad?.en ? `${rad.en} kanji` : 'kanji'),
    bottomText,
    bottomKanaText,
    cardReadings,
    deduplicatedOn,
    deduplicatedKun,
    allOnReadings,
    allKunReadings,
    meanings: cleanMeanings.length > 0 ? cleanMeanings : [rad?.en ? `${rad.en} kanji` : 'kanji'],
    strokes: entry.s || nfcFallback?.s || 10,
    grade,
    frequency: entry.f ?? nfcFallback?.f ?? null,
    jlpt,
    kanjiGroup,
    visualFormula,
    radicalNumber: radNum,
    radicalGlyph: rad?.glyph ?? '一',
    radicalNameEn: rad?.en ?? 'one',
    isRadicalBase,
    radicalBaseNumber,
    unicodePoint: code,
    unicodeHex,
    catalogOrder,
    searchIndex: `${entry.c} ${nfcChar} ${cleanMeanings.join(' ')} ${allRomaji} ${allStdRomaji} ${allKana} ${rad?.en ?? ''} ${rad?.glyph ?? ''} ${isRadicalBase ? 'radical base kangxi' : ''} ${category === 'hyogai_kanji' ? 'hyogai' : ''} ${groupMeta?.name ?? ''} group-${kanjiGroup} ${jlpt ? `jlpt n${jlpt}` : ''} ${visualFormula}`.toLowerCase(),
    hasYotsuganaResolution,
    wiktionaryTemplate: wikitext || undefined,
  };
}

export async function loadInitialCatalog(): Promise<{
  items: CharacterItem[];
  radicals: KangxiRadical[];
  rawSeedKanji: RawSeedKanji[];
}> {
  const baseUrl = import.meta.env?.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  let res = await fetch(`${normalizedBase}kanji-seed.json`);
  if (!res.ok) {
    res = await fetch('./kanji-seed.json');
  }
  const payload: RawSeedPayload = await res.json();

  const radicalMap = new Map<number, KangxiRadical>();
  const radicalGlyphSet = new Set<string>();
  for (const r of payload.radicals) {
    radicalMap.set(r.num, r);
    radicalGlyphSet.add(r.glyph);
    radicalGlyphSet.add(r.glyph.normalize('NFKC'));
  }

  // Merge any cached kanjiapi.dev v2 hydration overrides
  const cachedKanjiApi = await getIdbValue<Record<string, KanjiApiDetailResponse>>(
    IDB_STORE_KANJIAPI_V2,
    'kanji_details_map',
    {}
  );

  // Filter Hyōgai strictly to the 3 qualifying criteria (Kanken Pre-1, JIS Level 1, or 214 Kangxi Radicals)
  const qualifyingSeedKanji = payload.kanji.filter((entry) => {
    if (entry.j === 1 || entry.j === 0) return true;
    const isRad = Boolean(entry.rb || radicalGlyphSet.has(entry.c));
    return isQualifyingHyogaiKanji(entry.c, isRad);
  });

  // Ensure every qualifying Kanken Pre-1 or JIS Level 1 character exists in the seed array
  const existingChars = new Set(qualifyingSeedKanji.map((k) => k.c));
  for (const ch of [...KANKEN_PRE1_SET, ...JIS_LEVEL_1_SET]) {
    if (!existingChars.has(ch)) {
      existingChars.add(ch);
      const hydrated = cachedKanjiApi[ch];
      qualifyingSeedKanji.push({
        c: ch,
        s: hydrated?.stroke_count || 12,
        g: hydrated?.grade ?? 0,
        f: hydrated?.freq_mainichi_shinbun ?? null,
        j: 2,
        r: 1,
        l: hydrated?.jlpt ?? null,
        m: hydrated?.meanings ?? [],
        on: (hydrated?.on_readings ?? []).map(katakanaToHiragana),
        kun: hydrated?.kun_readings ?? [],
      });
    }
  }

  // Apply cached kanjiapi.dev details where seed fields were incomplete
  for (const entry of qualifyingSeedKanji) {
    const api = cachedKanjiApi[entry.c];
    if (api) {
      if ((!entry.m || entry.m.length === 0 || (entry.m.length === 1 && entry.m[0] === 'kanji')) && api.meanings?.length) {
        entry.m = api.meanings;
      }
      if ((!entry.on || entry.on.length === 0) && api.on_readings?.length) {
        entry.on = api.on_readings.map(katakanaToHiragana);
      }
      if ((!entry.kun || entry.kun.length === 0) && api.kun_readings?.length) {
        entry.kun = api.kun_readings;
      }
      if (api.stroke_count) entry.s = api.stroke_count;
      if (api.jlpt !== null && api.jlpt !== undefined) entry.l = api.jlpt;
      if (api.freq_mainichi_shinbun !== null && api.freq_mainichi_shinbun !== undefined) {
        entry.f = api.freq_mainichi_shinbun;
      }
    }
  }

  const nfcLookup = new Map<string, RawSeedKanji>();
  for (const k of qualifyingSeedKanji) {
    if (k.m && k.m.length > 0 && k.m[0] !== 'kanji') {
      nfcLookup.set(k.c, k);
    }
  }

  const cachedWik = await getIdbValue<Record<string, string>>(
    IDB_STORE_WIK_V2,
    'wikitext_map',
    {}
  );
  const mergedWik: Record<string, string> = { ...cachedWik };
  let addedToCache = false;

  const kanjiItems: CharacterItem[] = qualifyingSeedKanji.map((entry, idx) => {
    if (entry.wt && !mergedWik[entry.c]) {
      mergedWik[entry.c] = entry.wt;
      addedToCache = true;
    }
    return buildKanjiCharacterItem(
      entry,
      radicalMap,
      idx,
      mergedWik[entry.c],
      nfcLookup
    );
  });

  if (addedToCache) {
    setIdbValue(IDB_STORE_WIK_V2, 'wikitext_map', mergedWik).catch(() => {});
  }

  const kanaAndSymbolItems = buildBuiltinKanaAndSymbols(kanjiItems.length);
  return {
    items: [...kanjiItems, ...kanaAndSymbolItems],
    radicals: payload.radicals,
    rawSeedKanji: qualifyingSeedKanji,
  };
}

/**
 * Primary live hydration from https://kanjiapi.dev + selective Wiktionary historical yotsugana sync
 * cached in IndexedDB schema v2.
 */
export async function syncMissingWiktionaryYotsugana(
  rawSeedKanji: RawSeedKanji[],
  radicalMap: Map<number, KangxiRadical>,
  onUpdatedItems: (updatedMap: Map<string, CharacterItem>) => void
): Promise<void> {
  const cachedWik = await getIdbValue<Record<string, string>>(
    IDB_STORE_WIK_V2,
    'wikitext_map',
    {}
  );
  const cachedKanjiApi = await getIdbValue<Record<string, KanjiApiDetailResponse>>(
    IDB_STORE_KANJIAPI_V2,
    'kanji_details_map',
    {}
  );

  const nfcLookup = new Map<string, RawSeedKanji>();
  for (const k of rawSeedKanji) {
    if (k.m && k.m.length > 0 && k.m[0] !== 'kanji') nfcLookup.set(k.c, k);
  }

  const updatedItems = new Map<string, CharacterItem>();
  let kanjiApiChanged = false;
  let wikChanged = false;

  // Step 1: Hydrate any kanji missing meanings or readings from https://kanjiapi.dev/v1/kanji/{char}
  const missingKanjiApiEntries = rawSeedKanji.filter((entry) => {
    if (cachedKanjiApi[entry.c]) return false;
    const noGloss = !entry.m || entry.m.length === 0 || (entry.m.length === 1 && entry.m[0] === 'kanji');
    const noReadings = (!entry.on || entry.on.length === 0) && (!entry.kun || entry.kun.length === 0);
    return noGloss || noReadings;
  });

  for (let i = 0; i < missingKanjiApiEntries.length; i += 12) {
    const batch = missingKanjiApiEntries.slice(i, i + 12);
    await Promise.all(
      batch.map(async (entry) => {
        try {
          const resp = await fetch(
            `https://kanjiapi.dev/v1/kanji/${encodeURIComponent(entry.c)}`
          );
          if (!resp.ok) {
            if (resp.status === 404) {
              cachedKanjiApi[entry.c] = {
                kanji: entry.c,
                grade: null,
                stroke_count: entry.s,
                meanings: entry.m,
                kun_readings: entry.kun,
                on_readings: entry.on,
                jlpt: entry.l ?? null,
                freq_mainichi_shinbun: entry.f,
              };
              kanjiApiChanged = true;
            }
            return;
          }
          const detail = (await resp.json()) as KanjiApiDetailResponse;
          cachedKanjiApi[entry.c] = detail;
          kanjiApiChanged = true;
          if (detail.meanings?.length) entry.m = detail.meanings;
          if (detail.on_readings?.length) {
            entry.on = detail.on_readings.map(katakanaToHiragana);
          }
          if (detail.kun_readings?.length) entry.kun = detail.kun_readings;
          if (detail.stroke_count) entry.s = detail.stroke_count;
          if (detail.jlpt !== null && detail.jlpt !== undefined) entry.l = detail.jlpt;
          if (detail.freq_mainichi_shinbun !== null && detail.freq_mainichi_shinbun !== undefined) {
            entry.f = detail.freq_mainichi_shinbun;
          }
          const idx = rawSeedKanji.indexOf(entry);
          const rebuilt = buildKanjiCharacterItem(
            entry,
            radicalMap,
            idx >= 0 ? idx : 0,
            cachedWik[entry.c] ?? entry.wt,
            nfcLookup
          );
          updatedItems.set(rebuilt.id, rebuilt);
        } catch {
          // Ignore network errors if offline
        }
      })
    );
  }

  if (kanjiApiChanged) {
    await setIdbValue(IDB_STORE_KANJIAPI_V2, 'kanji_details_map', cachedKanjiApi);
  }

  // Step 2: Selective Wiktionary MediaWiki API sync for yotsugana candidates (じ/ず/ジ/ズ) or still-missing glosses
  const missingWikCandidates = rawSeedKanji.filter((entry) => {
    const missingDef =
      !entry.m || entry.m.length === 0 || (entry.m.length === 1 && entry.m[0] === 'kanji');
    const needsYotsugana =
      !entry.wt &&
      !cachedWik[entry.c] &&
      hasYotsuganaCandidate([...(entry.on || []), ...(entry.kun || [])]);
    return missingDef || needsYotsugana;
  });

  for (let i = 0; i < missingWikCandidates.length; i += 50) {
    const batch = missingWikCandidates.slice(i, i + 50);
    const titles = batch.map((b) => b.c).join('|');
    const url = `https://en.wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&origin=*&titles=${encodeURIComponent(titles)}`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const pages = Object.values(data?.query?.pages || {}) as Array<{
        title?: string;
        revisions?: Array<{ '*'?: string }>;
      }>;
      for (const p of pages) {
        const title = p.title;
        const txt = p.revisions?.[0]?.['*'] || '';
        const matches = txt.match(/\{\{ja-readings[\s\S]*?\}\}/g);
        if (title && (matches || txt)) {
          cachedWik[title] = matches ? matches.join('\n') : txt;
          wikChanged = true;
          const entryIdx = rawSeedKanji.findIndex((k) => k.c === title);
          if (entryIdx >= 0) {
            const entry = rawSeedKanji[entryIdx];
            if (
              !entry.m ||
              entry.m.length === 0 ||
              (entry.m.length === 1 && entry.m[0] === 'kanji')
            ) {
              const extracted = extractWiktionaryMeanings(txt);
              if (extracted.length > 0) entry.m = extracted;
            }
            const rebuilt = buildKanjiCharacterItem(
              entry,
              radicalMap,
              entryIdx,
              cachedWik[title],
              nfcLookup
            );
            updatedItems.set(rebuilt.id, rebuilt);
          }
        }
      }
    } catch {
      // Ignore network errors if offline
    }
  }

  if (wikChanged) {
    await setIdbValue(IDB_STORE_WIK_V2, 'wikitext_map', cachedWik);
  }
  if (updatedItems.size > 0) {
    onUpdatedItems(updatedItems);
  }
}
