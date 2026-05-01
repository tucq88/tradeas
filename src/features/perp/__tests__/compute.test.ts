import { describe, it, expect } from 'vitest';
import {
  effectiveMmr,
  unrealizedPnl,
  realizedPnl,
  computeLiqDistance,
  isLiqWarn,
} from '../compute';
import type { PerpPosition } from '@/data/types';
import type { Settings } from '@/state/settings';
import { DEFAULTS } from '@/state/settings';

function makeRow(overrides: Partial<PerpPosition> = {}): PerpPosition {
  return {
    id: '1',
    created_at: '2024-01-01T00:00:00Z',
    symbol: 'BTCUSDT',
    direction: 'long',
    entry_price: 50000,
    leverage: 10,
    size_usdt: 100,
    status: 'open',
    closed_at: null,
    exit_price: null,
    mmr_override: null,
    ...overrides,
  };
}

const settings: Settings = { ...DEFAULTS, mmrPct: 0.5 };

describe('effectiveMmr', () => {
  it('uses mmr_override when set', () => {
    const row = makeRow({ mmr_override: 0.01 });
    expect(effectiveMmr(row, settings)).toBe(0.01);
  });

  it('falls back to settings.mmrPct / 100', () => {
    const row = makeRow({ mmr_override: null });
    expect(effectiveMmr(row, settings)).toBeCloseTo(0.005);
  });
});

describe('unrealizedPnl', () => {
  it('long in profit', () => {
    const row = makeRow({ direction: 'long', entry_price: 50000, leverage: 10, size_usdt: 100 });
    // contractSize = 100 * 10 / 50000 = 0.02 BTC
    // pnl = (55000 - 50000) * 0.02 = 100
    expect(unrealizedPnl(row, 55000)).toBeCloseTo(100);
  });

  it('long in loss', () => {
    const row = makeRow({ direction: 'long', entry_price: 50000, leverage: 10, size_usdt: 100 });
    // pnl = (45000 - 50000) * 0.02 = -100
    expect(unrealizedPnl(row, 45000)).toBeCloseTo(-100);
  });

  it('short in profit', () => {
    const row = makeRow({ direction: 'short', entry_price: 50000, leverage: 10, size_usdt: 100 });
    // pnl = (50000 - 45000) * 0.02 = 100
    expect(unrealizedPnl(row, 45000)).toBeCloseTo(100);
  });

  it('short in loss', () => {
    const row = makeRow({ direction: 'short', entry_price: 50000, leverage: 10, size_usdt: 100 });
    // pnl = (50000 - 55000) * 0.02 = -100
    expect(unrealizedPnl(row, 55000)).toBeCloseTo(-100);
  });

  it('1x leverage', () => {
    const row = makeRow({ direction: 'long', entry_price: 100, leverage: 1, size_usdt: 100 });
    // contractSize = 100 * 1 / 100 = 1
    // pnl = (110 - 100) * 1 = 10
    expect(unrealizedPnl(row, 110)).toBeCloseTo(10);
  });

  it('100x leverage', () => {
    const row = makeRow({ direction: 'long', entry_price: 100, leverage: 100, size_usdt: 100 });
    // contractSize = 100 * 100 / 100 = 100
    // pnl = (101 - 100) * 100 = 100
    expect(unrealizedPnl(row, 101)).toBeCloseTo(100);
  });
});

describe('realizedPnl', () => {
  it('returns null when exit_price is null', () => {
    expect(realizedPnl(makeRow())).toBeNull();
  });

  it('long realized profit', () => {
    const row = makeRow({ direction: 'long', entry_price: 50000, leverage: 10, size_usdt: 100, exit_price: 55000, status: 'closed' });
    expect(realizedPnl(row)).toBeCloseTo(100);
  });

  it('short realized profit', () => {
    const row = makeRow({ direction: 'short', entry_price: 50000, leverage: 10, size_usdt: 100, exit_price: 45000, status: 'closed' });
    expect(realizedPnl(row)).toBeCloseTo(100);
  });
});

describe('computeLiqDistance', () => {
  it('long: positive distance when mark is above liq', () => {
    const row = makeRow({ direction: 'long', entry_price: 50000, leverage: 10 });
    const mmr = 0.005;
    // liq = 50000 * (1 - 1/10 + 0.005) = 50000 * 0.905 = 45250
    const dist = computeLiqDistance(row, 50000, mmr);
    expect(dist).toBeGreaterThan(0);
  });

  it('short: positive distance when mark is below liq', () => {
    const row = makeRow({ direction: 'short', entry_price: 50000, leverage: 10 });
    const mmr = 0.005;
    // liq = 50000 * (1 + 1/10 - 0.005) = 50000 * 1.095 = 54750
    const dist = computeLiqDistance(row, 50000, mmr);
    expect(dist).toBeGreaterThan(0);
  });

  it('amber boundary at exactly 10%', () => {
    // liqDist = 0.10 → isLiqWarn should be true
    expect(isLiqWarn(0.10)).toBe(true);
    // liqDist = 0.101 → isLiqWarn should be false
    expect(isLiqWarn(0.101)).toBe(false);
    // negative case
    expect(isLiqWarn(-0.10)).toBe(true);
  });
});
