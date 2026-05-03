import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { spotLots } from '@/data/spotLots';
import type { SpotLot } from '@/data/types';
import { useCoingeckoPrices } from '@/data/hooks/useCoingeckoPrices';
import { aggregateWip, type AssetAgg } from '@/features/spot/aggregate';
import { fmtUSD, fmtNum } from '@/lib/format';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { TokenLogo } from '@/ui/TokenLogo';
import { DonutChart, type Slice } from './DonutChart';
import { assignColor } from './palette';

export function computeSlices(aggs: AssetAgg[]): Slice[] {
  const valid = aggs.filter(
    (a): a is AssetAgg & { currentValue: number } =>
      a.currentValue !== null && a.currentValue > 0,
  );
  const sorted = [...valid].sort((a, b) => b.currentValue - a.currentValue);
  const totalValue = sorted.reduce((sum, a) => sum + a.currentValue, 0);
  if (totalValue === 0) return [];
  return sorted.map((agg, i) => ({
    asset: agg.asset,
    image: agg.image,
    currentValue: agg.currentValue,
    pctOfBook: agg.currentValue / totalValue,
    unrealizedPnl: agg.unrealizedPnl,
    color: assignColor(i),
  }));
}

export function AllocationPanel() {
  const qc = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  const {
    data: lots = [],
    isLoading,
    isError,
  } = useQuery<SpotLot[]>({
    queryKey: ['spot-lots'],
    queryFn: () => spotLots.list(),
  });

  const wip = lots.filter((l) => l.status === 'wip');
  const uniqueIds = [...new Set(
    wip.map((l) => l.coingecko_id).filter((id): id is string => id !== null),
  )];
  const { data: priceMap = {} } = useCoingeckoPrices(uniqueIds);

  const aggs = aggregateWip(wip, priceMap);
  const unavailableAssets = aggs.filter((a) => a.currentValue === null).map((a) => a.asset);
  const slices = computeSlices(aggs);
  const totalValue = slices.reduce((s, sl) => s + sl.currentValue, 0);
  const isEmpty = slices.length === 0;

  const handleRefresh = () => {
    void qc.invalidateQueries({ queryKey: ['spot-lots'] });
    void qc.invalidateQueries({ queryKey: ['coingecko', 'prices'] });
  };

  const cardAction = isEmpty ? (
    <Button onClick={handleRefresh}>refresh</Button>
  ) : (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[13px] text-fg-1 tabular-nums">{fmtUSD(totalValue)}</span>
      <Button onClick={handleRefresh}>refresh</Button>
    </div>
  );

  return (
    <Card title="allocation" action={cardAction}>
      {isLoading && <p className="text-fg-3 text-[13px]">loading…</p>}
      {isError && <p className="text-loss text-[13px]">error loading lots</p>}
      {!isLoading && !isError && isEmpty && (
        <p className="text-fg-3 text-[13px]">
          no WIP lots yet — add a lot in spot tracker
        </p>
      )}
      {!isLoading && !isError && !isEmpty && (
        <>
          <DonutChart
            slices={slices}
            selectedAsset={selectedAsset}
            onSelect={setSelectedAsset}
            onHover={setHoveredAsset}
            hoveredAsset={hoveredAsset}
          />
          <div className="flex flex-col gap-1 mt-2">
            {slices.map((slice) => (
              <div key={slice.asset} className="flex items-center gap-2 text-[12px]">
                <span
                  className="inline-block w-3 h-3 rounded-[2px] shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <TokenLogo symbol={slice.asset} src={slice.image} />
                <span className="font-mono font-medium text-fg-1 w-10 shrink-0">
                  {slice.asset}
                </span>
                <span className="font-mono text-fg-3">
                  {fmtNum(slice.pctOfBook * 100, 1)}%
                </span>
                <span className="font-mono text-fg-2 ml-auto">
                  {fmtUSD(slice.currentValue)}
                </span>
              </div>
            ))}
            {unavailableAssets.length > 0 && (
              <p className="text-fg-3 text-[11px] mt-1">
                {unavailableAssets.join(', ')} · price unavailable
              </p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
