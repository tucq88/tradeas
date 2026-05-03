import { fetchJson } from './client';

export type CoinListEntry = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  mcap_rank?: number;
};

type RawListItem = { id: string; symbol: string; name: string };
export type RawMarketItem = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number | null;
  current_price?: number;
};

const BASE = 'https://api.coingecko.com/api/v3';

export async function getCoinList(): Promise<RawListItem[]> {
  return fetchJson<RawListItem[]>(`${BASE}/coins/list?include_platform=false`);
}

export async function getTopCoins(pages = 2): Promise<RawMarketItem[]> {
  const results: RawMarketItem[] = [];
  for (let page = 1; page <= pages; page++) {
    const items = await fetchJson<RawMarketItem[]>(
      `${BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`,
    );
    results.push(...items);
  }
  return results;
}

export function mergeCoinList(
  list: RawListItem[],
  top: RawMarketItem[],
): Map<string, CoinListEntry> {
  const map = new Map<string, CoinListEntry>();
  for (const item of list) {
    map.set(item.id, { id: item.id, symbol: item.symbol, name: item.name });
  }
  for (const item of top) {
    const existing = map.get(item.id);
    if (existing) {
      existing.image = item.image;
      if (item.market_cap_rank !== null) existing.mcap_rank = item.market_cap_rank;
    } else {
      map.set(item.id, {
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        image: item.image,
        mcap_rank: item.market_cap_rank ?? undefined,
      });
    }
  }
  return map;
}
