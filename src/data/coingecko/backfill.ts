import type { CoinListEntry } from './coinList';

export type ResolveResult =
  | { kind: 'resolved'; id: string }
  | { kind: 'ambiguous'; candidates: CoinListEntry[] }
  | { kind: 'not_found' };

export function resolveAssetSymbolToId(
  symbol: string,
  coinList: Map<string, CoinListEntry>,
): ResolveResult {
  const upper = symbol.toUpperCase();
  const matches: CoinListEntry[] = [];
  for (const entry of coinList.values()) {
    if (entry.symbol.toUpperCase() === upper) matches.push(entry);
  }

  if (matches.length === 0) return { kind: 'not_found' };
  if (matches.length === 1) return { kind: 'resolved', id: matches[0].id };

  const ranked = matches.filter((m) => m.mcap_rank !== undefined);
  if (ranked.length === 0) return { kind: 'ambiguous', candidates: matches };

  ranked.sort((a, b) => (a.mcap_rank ?? Infinity) - (b.mcap_rank ?? Infinity));
  return { kind: 'resolved', id: ranked[0].id };
}
