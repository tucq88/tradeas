import { describe, it, expect } from 'vitest';
import { resolveAssetSymbolToId } from '../coingecko/backfill';
import type { CoinListEntry } from '../coingecko/coinList';

function makeList(entries: Partial<CoinListEntry>[]): Map<string, CoinListEntry> {
  const map = new Map<string, CoinListEntry>();
  for (const e of entries) {
    const entry: CoinListEntry = {
      id: e.id ?? 'id',
      symbol: e.symbol ?? 'SYM',
      name: e.name ?? 'Name',
      mcap_rank: e.mcap_rank,
    };
    map.set(entry.id, entry);
  }
  return map;
}

describe('resolveAssetSymbolToId', () => {
  it('resolves exact single match', () => {
    const list = makeList([{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', mcap_rank: 1 }]);
    const result = resolveAssetSymbolToId('BTC', list);
    expect(result).toEqual({ kind: 'resolved', id: 'bitcoin' });
  });

  it('is case-insensitive', () => {
    const list = makeList([{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' }]);
    const result = resolveAssetSymbolToId('btc', list);
    expect(result.kind).toBe('resolved');
  });

  it('returns ambiguous when no candidates found', () => {
    const list = makeList([{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' }]);
    const result = resolveAssetSymbolToId('DOGE', list);
    expect(result.kind).toBe('ambiguous');
  });

  it('uses mcap_rank tiebreak when multiple ranked matches', () => {
    const list = makeList([
      { id: 'uniswap', symbol: 'uni', name: 'Uniswap', mcap_rank: 20 },
      { id: 'uni-v2', symbol: 'uni', name: 'Uniswap V2', mcap_rank: 150 },
    ]);
    const result = resolveAssetSymbolToId('UNI', list);
    expect(result).toEqual({ kind: 'resolved', id: 'uniswap' });
  });

  it('returns ambiguous when any candidate lacks mcap_rank', () => {
    const list = makeList([
      { id: 'uniswap', symbol: 'uni', name: 'Uniswap', mcap_rank: 20 },
      { id: 'uni-v2', symbol: 'uni', name: 'Uniswap V2' }, // no rank
    ]);
    const result = resolveAssetSymbolToId('UNI', list);
    expect(result.kind).toBe('ambiguous');
    expect((result as { kind: 'ambiguous'; candidates: CoinListEntry[] }).candidates).toHaveLength(2);
  });
});
