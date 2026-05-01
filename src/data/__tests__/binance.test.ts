import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSpotPrice, getSpotPrices } from '../binance/spot';
import { getMarkPrice, getMarkPrices } from '../binance/futures';
import { BinanceError } from '../binance/errors';

function mockFetch(body: unknown, status = 200) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

function mockFetchError(msg = 'Failed to fetch') {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError(msg)));
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('getSpotPrice', () => {
  it('returns price for single symbol', async () => {
    mockFetch({ symbol: 'BTCUSDT', price: '64210.50' });
    const price = await getSpotPrice('BTCUSDT');
    expect(price).toBe(64210.5);
  });
});

describe('getSpotPrices', () => {
  it('returns record for batched symbols', async () => {
    mockFetch([
      { symbol: 'BTCUSDT', price: '64210.50' },
      { symbol: 'ETHUSDT', price: '3100.00' },
    ]);
    const prices = await getSpotPrices(['BTCUSDT', 'ETHUSDT']);
    expect(prices['BTCUSDT']).toBe(64210.5);
    expect(prices['ETHUSDT']).toBe(3100.0);
  });

  it('sorts symbols before keying (ETHUSDT,BTCUSDT same as BTCUSDT,ETHUSDT)', async () => {
    mockFetch([
      { symbol: 'BTCUSDT', price: '64000' },
      { symbol: 'ETHUSDT', price: '3000' },
    ]);
    const prices = await getSpotPrices(['ETHUSDT', 'BTCUSDT']);
    expect(Object.keys(prices).sort()).toEqual(['BTCUSDT', 'ETHUSDT']);
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fetchCall).toContain('BTCUSDT');
    expect(fetchCall.indexOf('BTCUSDT')).toBeLessThan(fetchCall.indexOf('ETHUSDT'));
  });
});

describe('getMarkPrice', () => {
  it('returns markPrice for single symbol', async () => {
    mockFetch({ symbol: 'BTCUSDT', markPrice: '64100.00' });
    const price = await getMarkPrice('BTCUSDT');
    expect(price).toBe(64100.0);
  });
});

describe('getMarkPrices', () => {
  it('filters universe to requested symbols', async () => {
    mockFetch([
      { symbol: 'BTCUSDT', markPrice: '64100' },
      { symbol: 'ETHUSDT', markPrice: '3050' },
      { symbol: 'SOLUSDT', markPrice: '120' },
    ]);
    const prices = await getMarkPrices(['BTCUSDT', 'SOLUSDT']);
    expect(prices['BTCUSDT']).toBe(64100);
    expect(prices['SOLUSDT']).toBe(120);
    expect(prices['ETHUSDT']).toBeUndefined();
  });
});

describe('error handling', () => {
  it('network error → BinanceError kind=network', async () => {
    mockFetchError('Failed to fetch');
    await expect(getSpotPrice('BTCUSDT')).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('HTTP 500 → BinanceError kind=http', async () => {
    mockFetch({ msg: 'Internal server error' }, 500);
    await expect(getSpotPrice('BTCUSDT')).rejects.toMatchObject({ kind: 'http' });
  });

  it('HTTP 400 with code -1121 → BinanceError kind=unknown-symbol', async () => {
    mockFetch({ code: -1121, msg: 'Invalid symbol.' }, 400);
    await expect(getSpotPrice('ZZZUSDT')).rejects.toMatchObject({
      kind: 'unknown-symbol',
    });
  });
});

describe('BinanceError', () => {
  it('is instanceof BinanceError', () => {
    const err = new BinanceError('network');
    expect(err).toBeInstanceOf(BinanceError);
    expect(err).toBeInstanceOf(Error);
    expect(err.kind).toBe('network');
  });
});
