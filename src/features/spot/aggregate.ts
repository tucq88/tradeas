import type { SpotLot } from '@/data/types';

export type AssetAgg = {
  asset: string;
  coingecko_id: string | null;
  image?: string;
  totalAmount: number;
  weightedAvgCost: number;
  totalInvested: number;
  currentValue: number | null;
  unrealizedPnl: number | null;
  pctDelta: number | null;
  lots: SpotLot[];
};

export function aggregateWip(
  wip: SpotLot[],
  priceMap: Record<string, { price: number; image: string } | null>,
): AssetAgg[] {
  const byBucket = new Map<string, SpotLot[]>();
  for (const lot of wip) {
    const key = lot.coingecko_id ?? lot.asset.toUpperCase();
    const arr = byBucket.get(key) ?? [];
    arr.push(lot);
    byBucket.set(key, arr);
  }

  return Array.from(byBucket.values()).map((lots) => {
    const asset = lots[0].asset;
    const totalAmount = lots.reduce((s, l) => s + Number(l.amount), 0);
    const totalInvested = lots.reduce((s, l) => s + Number(l.cost_usd), 0);
    const weightedAvgCost = totalAmount > 0 ? totalInvested / totalAmount : 0;
    const coingecko_id = lots.find((l) => l.coingecko_id != null)?.coingecko_id ?? null;
    const priceData = coingecko_id !== null ? priceMap[coingecko_id] : null;
    const spotPrice = priceData?.price ?? null;
    const image = priceData?.image;
    const currentValue = spotPrice !== null ? totalAmount * spotPrice : null;
    const unrealizedPnl = currentValue !== null ? currentValue - totalInvested : null;
    const pctDelta =
      unrealizedPnl !== null ? (totalInvested > 0 ? unrealizedPnl / totalInvested : 0) : null;
    return {
      asset,
      coingecko_id,
      image,
      totalAmount,
      weightedAvgCost,
      totalInvested,
      currentValue,
      unrealizedPnl,
      pctDelta,
      lots,
    };
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
