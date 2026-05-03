import { useEffect, useRef, useState } from 'react';
import { useCoinList } from '@/data/hooks/useCoinList';
import { resolveAssetSymbolToId } from '@/data/coingecko/backfill';
import { spotLots } from '@/data/spotLots';
import type { SpotLot } from '@/data/types';

export function useCoingeckoBackfill(lots: SpotLot[]): { unresolved: SpotLot[] } {
  const { data: coinList } = useCoinList();
  const [unresolvedIds, setUnresolvedIds] = useState<Set<string>>(new Set());
  const triedRef = useRef(false);

  useEffect(() => {
    if (!coinList || triedRef.current) return;
    triedRef.current = true;

    const unmapped = lots.filter((l) => !l.coingecko_id);
    if (unmapped.length === 0) return;

    const byAsset = new Map<string, SpotLot[]>();
    for (const lot of unmapped) {
      const arr = byAsset.get(lot.asset) ?? [];
      arr.push(lot);
      byAsset.set(lot.asset, arr);
    }

    const newUnresolved = new Set<string>();
    for (const [asset, assetLots] of byAsset.entries()) {
      const result = resolveAssetSymbolToId(asset, coinList);
      if (result.kind === 'resolved') {
        for (const lot of assetLots) {
          void spotLots.update(lot.id, { coingecko_id: result.id });
        }
      } else {
        for (const lot of assetLots) newUnresolved.add(lot.id);
      }
    }
    setUnresolvedIds(newUnresolved);
  }, [coinList]);

  const unresolved = lots.filter((l) => unresolvedIds.has(l.id) && !l.coingecko_id);
  return { unresolved };
}
