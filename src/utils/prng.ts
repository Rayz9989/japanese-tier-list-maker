/**
 * Deterministic PRNG (cyrb128 + mulberry32) for reproducible seeded random sorting per tab.
 */

export function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function mulberry32(a: number): () => number {
  let state = a >>> 0;
  return function () {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic Fisher-Yates shuffle driven by a string seed.
 */
export function seededShuffle<T>(items: readonly T[], seed: string, descending = false): T[] {
  const arr = [...items];
  const [s0] = cyrb128(seed || 'default-seed');
  const rand = mulberry32(s0);

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  if (descending) {
    arr.reverse();
  }
  return arr;
}

/**
 * Generate a human-readable random seed string.
 */
export function generateRandomSeed(): string {
  const prefixes = ['sakura', 'fuji', 'kotoba', 'yotsugana', 'sumi', 'kaede', 'tsuki', 'kaze'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${p}-${num}`;
}
