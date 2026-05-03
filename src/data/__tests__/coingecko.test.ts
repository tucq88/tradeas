import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCoinList, getTopCoins, mergeCoinList } from '../coingecko/coinList';
import { getCoinPrices } from '../coingecko/spot';
import { CoingeckoError } from '../coingecko/errors';

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response));
}

function mockFetchError(msg = 'Failed to fetch') {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError(msg)));
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('getCoinList', () => {
  it('returns coin list from API', async () => {
    mockFetch([{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' }]);
    const list = await getCoinList();
    expect(list[0].id).toBe('bitcoin');
  });

  it('throws CoingeckoError on network failure', async () => {
    mockFetchError();
    await expect(getCoinList()).rejects.toBeInstanceOf(CoingeckoError);
  });

  it('throws CoingeckoError with kind=rate-limit on 429', async () => {
    mockFetch({}, 429);
    await expect(getCoinList()).rejects.toMatchObject({ kind: 'rate-limit' });
  });
});

describe('getTopCoins', () => {
  it('fetches given number of pages and concatenates', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://img/btc.png', market_cap_rank: 1 },
      ]) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([
        { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://img/eth.png', market_cap_rank: 2 },
      ]) } as Response),
    );
    const coins = await getTopCoins(2);
    expect(coins).toHaveLength(2);
    expect(coins[0].id).toBe('bitcoin');
    expect(coins[1].id).toBe('ethereum');
  });
});

describe('mergeCoinList', () => {
  it('enriches list entries with image and rank from top', () => {
    const list = [{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' }];
    const top = [{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://img/btc.png', market_cap_rank: 1 }];
    const map = mergeCoinList(list, top);
    expect(map.get('bitcoin')?.image).toBe('https://img/btc.png');
    expect(map.get('bitcoin')?.mcap_rank).toBe(1);
  });

  it('rank tiebreak: entry with lowest mcap_rank wins when both ranked', () => {
    const list = [
      { id: 'uni-v2', symbol: 'uni', name: 'Uniswap V2' },
      { id: 'uniswap', symbol: 'uni', name: 'Uniswap' },
    ];
    const top = [
      { id: 'uniswap', symbol: 'uni', name: 'Uniswap', image: '', market_cap_rank: 20 },
      { id: 'uni-v2', symbol: 'uni', name: 'Uniswap V2', image: '', market_cap_rank: 150 },
    ];
    const map = mergeCoinList(list, top);
    // resolveAssetSymbolToId picks rank 20 (uniswap) over 150
    expect(map.get('uniswap')?.mcap_rank).toBe(20);
    expect(map.get('uni-v2')?.mcap_rank).toBe(150);
  });
});

describe('getCoinPrices', () => {
  it('returns price and image for known ids', async () => {
    mockFetch([
      { id: 'bitcoin', current_price: 64000, image: 'https://img/btc.png', symbol: 'btc', name: 'Bitcoin', market_cap_rank: 1 },
    ]);
    const prices = await getCoinPrices(['bitcoin']);
    expect(prices['bitcoin']?.price).toBe(64000);
    expect(prices['bitcoin']?.image).toBe('https://img/btc.png');
  });

  it('returns null for ids not in response', async () => {
    mockFetch([
      { id: 'bitcoin', current_price: 64000, image: '', symbol: 'btc', name: 'Bitcoin', market_cap_rank: 1 },
    ]);
    const prices = await getCoinPrices(['bitcoin', 'unknown-coin']);
    expect(prices['bitcoin']).not.toBeNull();
    expect(prices['unknown-coin']).toBeNull();
  });

  it('returns null for all ids on network failure', async () => {
    mockFetchError();
    const prices = await getCoinPrices(['bitcoin', 'ethereum']);
    expect(prices['bitcoin']).toBeNull();
    expect(prices['ethereum']).toBeNull();
  });
});
