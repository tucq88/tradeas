import { fetchJson } from './client';
import type { RawMarketItem } from './coinList';

const BASE = 'https://api.coingecko.com/api/v3';
const CHUNK_SIZE = 250;
const IMAGE_CACHE_KEY = 'coingecko-image-cache';

function readImageCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function writeImageCache(updates: Record<string, string>): void {
  try {
    const existing = readImageCache();
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify({ ...existing, ...updates }));
  } catch {
    // quota exceeded — ignore
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export async function getCoinPrices(
  ids: string[],
): Promise<Record<string, { price: number; image: string } | null>> {
  const result: Record<string, { price: number; image: string } | null> = {};
  const imageCache = readImageCache();
  const chunks = chunk(ids, CHUNK_SIZE);

  for (const ch of chunks) {
    const params = new URLSearchParams({
      vs_currency: 'usd',
      ids: ch.join(','),
      per_page: String(CHUNK_SIZE),
    });
    try {
      const items = await fetchJson<RawMarketItem[]>(`${BASE}/coins/markets?${params.toString()}`);
      const newImages: Record<string, string> = {};
      for (const item of items) {
        const image = item.image || imageCache[item.id] || '';
        result[item.id] = { price: item.current_price ?? 0, image };
        if (item.image) newImages[item.id] = item.image;
      }
      if (Object.keys(newImages).length) writeImageCache(newImages);
    } catch {
      for (const id of ch) result[id] = null;
    }
    for (const id of ch) {
      if (!(id in result)) {
        const cachedImg = imageCache[id] ?? '';
        result[id] = null;
        void cachedImg; // image-only lot stays null until price fetch succeeds
      }
    }
  }

  return result;
}
