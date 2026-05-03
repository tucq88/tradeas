import { useQuery } from '@tanstack/react-query';
import { getCoinList, getTopCoins, mergeCoinList } from '@/data/coingecko/coinList';
import type { CoinListEntry, RawMarketItem } from '@/data/coingecko/coinList';

type RawListItem = { id: string; symbol: string; name: string };

const TTL = 24 * 60 * 60 * 1000;

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: T };
    return Date.now() - parsed.ts < TTL ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // quota exceeded — ignore
  }
}

async function fetchCoinList(): Promise<Map<string, CoinListEntry>> {
  const cachedList = readCache<RawListItem[]>('coingecko-coin-list');
  const cachedTop = readCache<RawMarketItem[]>('coingecko-top-coins');

  const [list, top] = await Promise.all([
    cachedList !== null
      ? Promise.resolve(cachedList)
      : getCoinList().then((data) => { writeCache('coingecko-coin-list', data); return data; }),
    cachedTop !== null
      ? Promise.resolve(cachedTop)
      : getTopCoins(2).then((data) => { writeCache('coingecko-top-coins', data); return data; }),
  ]);

  return mergeCoinList(list, top);
}

export function useCoinList() {
  return useQuery({
    queryKey: ['coingecko', 'coin-list'],
    queryFn: fetchCoinList,
    staleTime: TTL,
  });
}
