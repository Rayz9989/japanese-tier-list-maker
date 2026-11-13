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

interface RawSeedKanji {
  c: string;
  s: number;
  g: number;
  f: number | null;
  j: number;
  r: number;
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

const IDB_NAME = 'kanji_tier_maker_db';
const IDB_STORE = 'wiktionary_yotsugana_v1';

function openYotsuganaDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getCachedWiktionaryMap(): Promise<Record<string, string>> {
  const db = await openYotsuganaDB();
  if (!db) return {};
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get('wikitext_map');
      req.onsuccess = () => resolve(req.result || {});
      req.onerror = () => resolve({});
    } catch {
      resolve({});
    }
  });
}

async function saveCachedWiktionaryMap(map: Record<string, string>): Promise<void> {
  const db = await openYotsuganaDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(map, 'wikitext_map');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
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

  // Format Middle Zone: top 2–3 English meanings joined by tight / without spaces.
  // Never fall back to repeating entry.c (the kanji glyph itself); use NFC fallback or Wiktionary glosses.
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
    grade: entry.g === 0 ? null : entry.g,
    frequency: entry.f ?? nfcFallback?.f ?? null,
    radicalNumber: radNum,
    radicalGlyph: rad?.glyph ?? '一',
    radicalNameEn: rad?.en ?? 'one',
    isRadicalBase,
    radicalBaseNumber,
    unicodePoint: code,
    unicodeHex,
    catalogOrder,
    searchIndex: `${entry.c} ${nfcChar} ${cleanMeanings.join(' ')} ${allRomaji} ${allStdRomaji} ${allKana} ${rad?.en ?? ''} ${rad?.glyph ?? ''} ${isRadicalBase ? 'radical base kangxi' : ''} ${category === 'hyogai_kanji' ? 'hyogai' : ''}`.toLowerCase(),
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
  for (const r of payload.radicals) {
    radicalMap.set(r.num, r);
  }

  const nfcLookup = new Map<string, RawSeedKanji>();
  for (const k of payload.kanji) {
    if (k.m && k.m.length > 0) {
      nfcLookup.set(k.c, k);
    }
  }

  const cachedWik = await getCachedWiktionaryMap();
  const mergedWik: Record<string, string> = { ...cachedWik };
  let addedToCache = false;

  const kanjiItems: CharacterItem[] = payload.kanji.map((entry, idx) => {
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
    saveCachedWiktionaryMap(mergedWik).catch(() => {});
  }

  const kanaAndSymbolItems = buildBuiltinKanaAndSymbols(kanjiItems.length);
  return {
    items: [...kanjiItems, ...kanaAndSymbolItems],
    radicals: payload.radicals,
    rawSeedKanji: payload.kanji,
  };
}

/**
 * Background Wiktionary MediaWiki API + kanjiapi.dev sync for any candidate kanji that don't yet have
 * cached {{ja-readings}} templates or definitions in IndexedDB (batches 50 kanji separated by | per request).
 */
export async function syncMissingWiktionaryYotsugana(
  rawSeedKanji: RawSeedKanji[],
  radicalMap: Map<number, KangxiRadical>,
  onUpdatedItems: (updatedMap: Map<string, CharacterItem>) => void
): Promise<void> {
  const cachedWik = await getCachedWiktionaryMap();
  const nfcLookup = new Map<string, RawSeedKanji>();
  for (const k of rawSeedKanji) {
    if (k.m && k.m.length > 0) nfcLookup.set(k.c, k);
  }

  const missingCandidates = rawSeedKanji.filter((entry) => {
    const missingDef = !entry.m || entry.m.length === 0;
    const needsYotsugana =
      !entry.wt &&
      !cachedWik[entry.c] &&
      hasYotsuganaCandidate([...(entry.on || []), ...(entry.kun || [])]);
    return missingDef || needsYotsugana;
  });

  if (missingCandidates.length === 0) return;

  const updatedItems = new Map<string, CharacterItem>();
  for (let i = 0; i < missingCandidates.length; i += 50) {
    const batch = missingCandidates.slice(i, i + 50);
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
          const entryIdx = rawSeedKanji.findIndex((k) => k.c === title);
          if (entryIdx >= 0) {
            const entry = rawSeedKanji[entryIdx];
            if (!entry.m || entry.m.length === 0) {
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

  if (updatedItems.size > 0) {
    await saveCachedWiktionaryMap(cachedWik);
    onUpdatedItems(updatedItems);
  }
}
