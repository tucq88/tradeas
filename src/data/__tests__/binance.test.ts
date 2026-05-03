import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    await expect(getMarkPrice('BTCUSDT')).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('HTTP 500 → BinanceError kind=http', async () => {
    mockFetch({ msg: 'Internal server error' }, 500);
    await expect(getMarkPrice('BTCUSDT')).rejects.toMatchObject({ kind: 'http' });
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
