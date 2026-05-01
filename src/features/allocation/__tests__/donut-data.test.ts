import { describe, expect, it } from 'vitest';
import { computeSlices } from '../AllocationPanel';
import type { AssetAgg } from '@/features/spot/aggregate';

function makeAgg(asset: string, currentValue: number | null, unrealizedPnl: number | null = null): AssetAgg {
  return {
    asset,
    weightedAvgCost: 0,
    totalInvested: 0,
    currentValue,
    unrealizedPnl,
    pctDelta: null,
    lots: [],
  };
}

describe('computeSlices', () => {
  it('sorts slices by currentValue descending', () => {
    const aggs = [makeAgg('ETH', 40000), makeAgg('BTC', 60000)];
    const slices = computeSlices(aggs);
    expect(slices[0].asset).toBe('BTC');
    expect(slices[1].asset).toBe('ETH');
  });

  it('computes pctOfBook correctly', () => {
    const aggs = [makeAgg('BTC', 60000), makeAgg('ETH', 40000)];
    const slices = computeSlices(aggs);
    expect(slices[0].pctOfBook).toBeCloseTo(0.6, 5);
    expect(slices[1].pctOfBook).toBeCloseTo(0.4, 5);
  });

  it('pctOfBook sums to ~1.0', () => {
    const aggs = [makeAgg('BTC', 60000), makeAgg('ETH', 25000), makeAgg('SOL', 15000)];
    const slices = computeSlices(aggs);
    const total = slices.reduce((s, sl) => s + sl.pctOfBook, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('filters out null currentValue', () => {
    const aggs = [makeAgg('BTC', 60000), makeAgg('ETH', null)];
    const slices = computeSlices(aggs);
    expect(slices).toHaveLength(1);
    expect(slices[0].asset).toBe('BTC');
  });

  it('filters out zero currentValue', () => {
    const aggs = [makeAgg('BTC', 60000), makeAgg('ETH', 0)];
    const slices = computeSlices(aggs);
    expect(slices).toHaveLength(1);
  });

  it('returns empty array when all currentValues are null', () => {
    const aggs = [makeAgg('BTC', null), makeAgg('ETH', null)];
    expect(computeSlices(aggs)).toHaveLength(0);
  });

  it('assigns colors in order', () => {
    const aggs = [makeAgg('BTC', 60000), makeAgg('ETH', 40000)];
    const slices = computeSlices(aggs);
    expect(slices[0].color).toBe('var(--alloc-1)');
    expect(slices[1].color).toBe('var(--alloc-2)');
  });

  it('passes through unrealizedPnl', () => {
    const aggs = [makeAgg('BTC', 60000, 5000), makeAgg('ETH', 40000, -200)];
    const slices = computeSlices(aggs);
    expect(slices[0].unrealizedPnl).toBe(5000);
    expect(slices[1].unrealizedPnl).toBe(-200);
  });
});
