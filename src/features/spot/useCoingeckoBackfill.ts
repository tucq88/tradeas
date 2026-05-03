import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCoinList } from '@/data/hooks/useCoinList';
import { resolveAssetSymbolToId } from '@/data/coingecko/backfill';
import { spotLots } from '@/data/spotLots';
import type { SpotLot } from '@/data/types';

export function useCoingeckoBackfill(lots: SpotLot[]): { unresolved: SpotLot[] } {
  const qc = useQueryClient();
  const { data: coinList } = useCoinList();
  const [unresolvedIds, setUnresolvedIds] = useState<Set<string>>(new Set());
  const triedAssetsRef = useRef<Set<string>>(new Set());

  const unmappedAssets = useMemo(
    () => Array.from(new Set(lots.filter((l) => !l.coingecko_id).map((l) => l.asset))),
    [lots],
  );
  const unmappedKey = unmappedAssets.join(',');

  useEffect(() => {
    if (!coinList || unmappedAssets.length === 0) return;

    const assetsToTry = unmappedAssets.filter((a) => !triedAssetsRef.current.has(a));
    if (assetsToTry.length === 0) return;

    const lotsByAsset = new Map<string, SpotLot[]>();
    for (const lot of lots) {
      if (lot.coingecko_id) continue;
      if (!assetsToTry.includes(lot.asset)) continue;
      const arr = lotsByAsset.get(lot.asset) ?? [];
      arr.push(lot);
      lotsByAsset.set(lot.asset, arr);
    }

    const updates: Promise<unknown>[] = [];
    setUnresolvedIds((prev) => {
      const next = new Set(prev);
      for (const asset of assetsToTry) {
        triedAssetsRef.current.add(asset);
        const assetLots = lotsByAsset.get(asset) ?? [];
        const result = resolveAssetSymbolToId(asset, coinList);
        if (result.kind === 'resolved') {
          for (const lot of assetLots) {
            updates.push(spotLots.update(lot.id, { coingecko_id: result.id }));
            next.delete(lot.id);
          }
        } else {
          for (const lot of assetLots) next.add(lot.id);
        }
      }
      return next;
    });

    if (updates.length > 0) {
      void Promise.all(updates).then(() => {
        void qc.invalidateQueries({ queryKey: ['spot-lots'] });
      });
    }
  }, [coinList, unmappedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const unresolved = lots.filter((l) => unresolvedIds.has(l.id) && !l.coingecko_id);
  return { unresolved };
}
