import { describe, it, expect } from 'vitest';
import { aggregateWip, aggregateDone } from '../aggregate';
import type { SpotLot } from '@/data/types';

const P = (price: number) => ({ price, image: '' });

function makeLot(overrides: Partial<SpotLot> = {}): SpotLot {
  return {
    id: '1',
    created_at: '2024-01-01T00:00:00Z',
    asset: 'BTC',
    coingecko_id: 'bitcoin',
    amount: 1,
    entry_price: 50000,
    cost_usd: 50000,
    date: '2024-01-01',
    status: 'wip',
    exit_price: null,
    exit_date: null,
    ...overrides,
  };
}

describe('aggregateWip', () => {
  it('computes weighted avg cost for multi-lot single asset', () => {
    const lots = [
      makeLot({ id: '1', amount: 1, entry_price: 50000, cost_usd: 50000 }),
      makeLot({ id: '2', amount: 1, entry_price: 60000, cost_usd: 60000 }),
    ];
    const [agg] = aggregateWip(lots, { bitcoin: P(55000) });
    expect(agg.weightedAvgCost).toBe(55000);
    expect(agg.totalInvested).toBe(110000);
    expect(agg.currentValue).toBeCloseTo(110000);
    expect(agg.unrealizedPnl).toBeCloseTo(0);
  });

  it('segregates multiple assets correctly', () => {
    const lots = [
      makeLot({ id: '1', asset: 'BTC', coingecko_id: 'bitcoin', amount: 1, cost_usd: 50000 }),
      makeLot({ id: '2', asset: 'ETH', coingecko_id: 'ethereum', amount: 10, cost_usd: 20000 }),
    ];
    const aggs = aggregateWip(lots, { bitcoin: P(50000), ethereum: P(2000) });
    expect(aggs).toHaveLength(2);
    const btc = aggs.find((a) => a.asset === 'BTC')!;
    const eth = aggs.find((a) => a.asset === 'ETH')!;
    expect(btc.totalInvested).toBe(50000);
    expect(eth.totalInvested).toBe(20000);
  });

  it('excludes done lots (caller filters, but ensures segregation)', () => {
    const wipLot = makeLot({ id: '1', status: 'wip' });
    const aggs = aggregateWip([wipLot], { bitcoin: P(50000) });
    expect(aggs).toHaveLength(1);
    expect(aggs[0].lots).toHaveLength(1);
  });

  it('handles zero amount without divide-by-zero', () => {
    const lots = [makeLot({ amount: 0, cost_usd: 0 })];
    const [agg] = aggregateWip(lots, { bitcoin: P(50000) });
    expect(agg.weightedAvgCost).toBe(0);
    expect(agg.currentValue).toBe(0);
    expect(agg.unrealizedPnl).toBe(0);
  });

  it('returns null unrealized fields when coingecko_id is null', () => {
    const lots = [makeLot({ coingecko_id: null })];
    const [agg] = aggregateWip(lots, {});
    expect(agg.currentValue).toBeNull();
    expect(agg.unrealizedPnl).toBeNull();
    expect(agg.pctDelta).toBeNull();
  });

  it('returns null unrealized fields when id not in priceMap', () => {
    const lots = [makeLot()];
    const [agg] = aggregateWip(lots, {});
    expect(agg.currentValue).toBeNull();
    expect(agg.unrealizedPnl).toBeNull();
    expect(agg.pctDelta).toBeNull();
  });

  it('treats explicit null in priceMap same as missing key', () => {
    const lots = [makeLot()];
    const [agg] = aggregateWip(lots, { bitcoin: null });
    expect(agg.currentValue).toBeNull();
    expect(agg.unrealizedPnl).toBeNull();
    expect(agg.pctDelta).toBeNull();
  });

  it('computes pctDelta as fraction (not percent) of invested', () => {
    const lots = [makeLot({ amount: 1, cost_usd: 50000 })];
    const [agg] = aggregateWip(lots, { bitcoin: P(55000) });
    // unrealizedPnl = 55000 - 50000 = 5000; pctDelta = 5000/50000 = 0.10
    expect(agg.pctDelta).toBeCloseTo(0.1);
  });

  it('includes image from priceMap in agg', () => {
    const lots = [makeLot()];
    const [agg] = aggregateWip(lots, { bitcoin: { price: 50000, image: 'https://img.cg/btc.png' } });
    expect(agg.image).toBe('https://img.cg/btc.png');
  });

  it('keeps lots with same symbol but different coingecko_id in separate buckets', () => {
    const lots = [
      makeLot({ id: '1', asset: 'UNI', coingecko_id: 'uniswap', amount: 10, cost_usd: 100 }),
      makeLot({ id: '2', asset: 'UNI', coingecko_id: 'uni-v2', amount: 5, cost_usd: 50 }),
    ];
    const aggs = aggregateWip(lots, { uniswap: P(10), 'uni-v2': P(20) });
    expect(aggs).toHaveLength(2);
    const a = aggs.find((x) => x.coingecko_id === 'uniswap')!;
    const b = aggs.find((x) => x.coingecko_id === 'uni-v2')!;
    expect(a.totalAmount).toBe(10);
    expect(b.totalAmount).toBe(5);
  });

  it('groups by uppercased symbol when coingecko_id is null', () => {
    const lots = [
      makeLot({ id: '1', asset: 'btc', coingecko_id: null, amount: 1, cost_usd: 50000 }),
      makeLot({ id: '2', asset: 'BTC', coingecko_id: null, amount: 1, cost_usd: 60000 }),
    ];
    const aggs = aggregateWip(lots, {});
    expect(aggs).toHaveLength(1);
    expect(aggs[0].totalAmount).toBe(2);
  });
});

describe('aggregateDone', () => {
  it('computes realized PnL per lot and sums by asset', () => {
    const lots = [
      makeLot({ id: '1', status: 'done', amount: 1, entry_price: 50000, exit_price: 60000 }),
      makeLot({ id: '2', status: 'done', amount: 0.5, entry_price: 50000, exit_price: 70000 }),
    ];
    const [agg] = aggregateDone(lots);
    // lot1: (60k-50k)*1 = 10000; lot2: (70k-50k)*0.5 = 10000
    expect(agg.realizedPnl).toBeCloseTo(20000);
    expect(agg.lots).toHaveLength(2);
  });

  it('segregates realized PnL by asset', () => {
    const lots = [
      makeLot({ id: '1', asset: 'BTC', status: 'done', amount: 1, entry_price: 50000, exit_price: 60000 }),
      makeLot({ id: '2', asset: 'ETH', status: 'done', amount: 10, entry_price: 2000, exit_price: 2500 }),
    ];
    const aggs = aggregateDone(lots);
    expect(aggs).toHaveLength(2);
    const btc = aggs.find((a) => a.asset === 'BTC')!;
    const eth = aggs.find((a) => a.asset === 'ETH')!;
    expect(btc.realizedPnl).toBeCloseTo(10000);
    expect(eth.realizedPnl).toBeCloseTo(5000);
  });
});
