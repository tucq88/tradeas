import type { SpotLot } from '@/data/types';
import { toBinancePair } from '@/lib/symbols';

export type AssetAgg = {
  asset: string;
  weightedAvgCost: number;
  totalInvested: number;
  currentValue: number | null;
  unrealizedPnl: number | null;
  pctDelta: number | null;
  lots: SpotLot[];
};

export function aggregateWip(wip: SpotLot[], priceMap: Record<string, number>): AssetAgg[] {
  const byAsset = new Map<string, SpotLot[]>();
  for (const lot of wip) {
    const arr = byAsset.get(lot.asset) ?? [];
    arr.push(lot);
    byAsset.set(lot.asset, arr);
  }

  return Array.from(byAsset.entries()).map(([asset, lots]) => {
    const totalAmount = lots.reduce((s, l) => s + Number(l.amount), 0);
    const totalInvested = lots.reduce((s, l) => s + Number(l.cost_usd), 0);
    const weightedAvgCost = totalAmount > 0 ? totalInvested / totalAmount : 0;
    const spotPrice = priceMap[toBinancePair(asset)];
    const currentValue = spotPrice !== undefined ? totalAmount * spotPrice : null;
    const unrealizedPnl = currentValue !== null ? currentValue - totalInvested : null;
    const pctDelta =
      unrealizedPnl !== null ? (totalInvested > 0 ? unrealizedPnl / totalInvested : 0) : null;
    return { asset, weightedAvgCost, totalInvested, currentValue, unrealizedPnl, pctDelta, lots };
  });
}

export function aggregateDone(
  done: SpotLot[],
): { asset: string; realizedPnl: number; lots: SpotLot[] }[] {
  const byAsset = new Map<string, SpotLot[]>();
  for (const lot of done) {
    const arr = byAsset.get(lot.asset) ?? [];
    arr.push(lot);
    byAsset.set(lot.asset, arr);
  }
  return Array.from(byAsset.entries()).map(([asset, lots]) => {
    const realizedPnl = lots.reduce((s, lot) => {
      const ep = lot.exit_price != null ? Number(lot.exit_price) : 0;
      return s + (ep - Number(lot.entry_price)) * Number(lot.amount);
    }, 0);
    return { asset, realizedPnl, lots };
  });
}
