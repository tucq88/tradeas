import { describe, it, expect } from 'vitest';
import { summarizeClosed } from '../aggregate';
import type { PerpPosition } from '@/data/types';

function makeRow(overrides: Partial<PerpPosition> = {}): PerpPosition {
  return {
    id: '1',
    created_at: '2024-01-01T00:00:00Z',
    symbol: 'BTCUSDT',
    direction: 'long',
    entry_price: 50000,
    leverage: 10,
    size_usdt: 100,
    status: 'closed',
    closed_at: '2024-01-02T00:00:00Z',
    exit_price: 55000,
    mmr_override: null,
    ...overrides,
  };
}

describe('summarizeClosed', () => {
  it('empty input → count 0, winRate 0, all stats 0, rows []', () => {
    const result = summarizeClosed([]);
    expect(result.count).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.totalPnl).toBe(0);
    expect(result.avgPnl).toBe(0);
    expect(result.bestPnl).toBe(0);
    expect(result.worstPnl).toBe(0);
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(0);
    expect(result.rows).toEqual([]);
  });

  it('one winning long, one losing short → winRate 0.5, totalPnl = sum, best > 0, worst < 0', () => {
    // Winning long: entry=50000, exit=55000, leverage=10, size=100
    // contractSize = 100 * 10 / 50000 = 0.02
    // pnl = (55000 - 50000) * 0.02 = 100
    const winningLong = makeRow({
      id: '1',
      direction: 'long',
      entry_price: 50000,
      leverage: 10,
      size_usdt: 100,
      exit_price: 55000,
      closed_at: '2024-01-03T00:00:00Z',
    });

    // Losing short: entry=50000, exit=55000, leverage=10, size=100
    // contractSize = 100 * 10 / 50000 = 0.02
    // pnl = (50000 - 55000) * 0.02 = -100
    const losingShort = makeRow({
      id: '2',
      direction: 'short',
      entry_price: 50000,
      leverage: 10,
      size_usdt: 100,
      exit_price: 55000,
      closed_at: '2024-01-02T00:00:00Z',
    });

    const result = summarizeClosed([winningLong, losingShort]);
    expect(result.count).toBe(2);
    expect(result.winRate).toBe(0.5);
    expect(result.totalPnl).toBeCloseTo(0);
    expect(result.bestPnl).toBeCloseTo(100);
    expect(result.worstPnl).toBeCloseTo(-100);
    expect(result.wins).toBe(1);
    expect(result.losses).toBe(1);
  });

  it('break-even trade (exit == entry) → counted in count, not in wins or losses', () => {
    const breakEven = makeRow({
      id: '1',
      direction: 'long',
      entry_price: 50000,
      exit_price: 50000,
      closed_at: '2024-01-02T00:00:00Z',
    });

    const result = summarizeClosed([breakEven]);
    expect(result.count).toBe(1);
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(0);
    expect(result.winRate).toBe(0); // 0/1 = 0
    expect(result.totalPnl).toBeCloseTo(0);
  });

  it('position with exit_price == null is skipped', () => {
    const noExit = makeRow({
      id: '1',
      exit_price: null,
      status: 'open',
    });
    const withExit = makeRow({
      id: '2',
      direction: 'long',
      entry_price: 50000,
      leverage: 10,
      size_usdt: 100,
      exit_price: 55000,
      closed_at: '2024-01-02T00:00:00Z',
    });

    const result = summarizeClosed([noExit, withExit]);
    expect(result.count).toBe(1);
    expect(result.rows[0].position.id).toBe('2');
  });

  it('rows sorted by closed_at desc; null closed_at falls to the bottom', () => {
    const oldest = makeRow({ id: '1', closed_at: '2024-01-01T00:00:00Z', exit_price: 55000 });
    const newest = makeRow({ id: '2', closed_at: '2024-01-03T00:00:00Z', exit_price: 55000 });
    const middle = makeRow({ id: '3', closed_at: '2024-01-02T00:00:00Z', exit_price: 55000 });
    const nullDate = makeRow({ id: '4', closed_at: null, exit_price: 55000 });

    const result = summarizeClosed([oldest, nullDate, newest, middle]);
    const ids = result.rows.map((r) => r.position.id);
    expect(ids).toEqual(['2', '3', '1', '4']);
  });
});
