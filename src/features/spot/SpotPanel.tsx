import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { spotLots } from '@/data/spotLots';
import type { SpotLot } from '@/data/types';
import { useSpotPrices } from '@/data/hooks/useSpotPrice';
import { useLastRefreshed } from '@/data/hooks/useLastRefreshed';
import { toBinancePair } from '@/lib/symbols';
import { aggregateWip } from './aggregate';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Tabs } from '@/ui/Tabs';
import { LotForm } from './LotForm';
import { LotRow } from './LotRow';
import { AssetAggregation } from './AssetAggregation';
import { RealizedSummary } from './RealizedSummary';

const TABS = [
  { id: 'wip', label: 'WIP' },
  { id: 'realized', label: 'Realized' },
];

export function SpotPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'wip' | 'realized'>('wip');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const {
    data: lots = [],
    isLoading,
    isError,
  } = useQuery<SpotLot[]>({
    queryKey: ['spot-lots'],
    queryFn: () => spotLots.list(),
  });

  const wip = lots.filter((l) => l.status === 'wip');
  const done = lots.filter((l) => l.status === 'done');

  const uniquePairs = [...new Set(wip.map((l) => toBinancePair(l.asset)))];
  const { data: priceMap = {} } = useSpotPrices(uniquePairs);

  const lastRefreshed = useLastRefreshed();
  const wipAggs = aggregateWip(wip, priceMap);

  const handleRefresh = () => {
    void qc.invalidateQueries({ queryKey: ['spot-lots'] });
    void qc.invalidateQueries({ queryKey: ['binance', 'spot'] });
  };

  const lastLabel = lastRefreshed
    ? lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const cardAction = (
    <div className="flex items-center gap-2">
      {lastLabel && <span className="text-fg-3 text-[11px]">refreshed {lastLabel}</span>}
      <Button onClick={handleRefresh}>refresh</Button>
    </div>
  );

  const toggleCollapse = (asset: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(asset)) next.delete(asset);
      else next.add(asset);
      return next;
    });
  };

  return (
    <Card title="spot portfolio" count={wip.length || undefined} action={cardAction}>
      {isLoading && <p className="text-fg-3 text-[13px]">loading…</p>}
      {isError && <p className="text-loss text-[13px]">error loading spot lots</p>}
      {!isLoading && !isError && (
        <>
          <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as 'wip' | 'realized')} />
          {tab === 'wip' && (
            <div className="overflow-x-auto flex flex-col gap-2 mt-2">
              <LotForm />
              {wip.length === 0 && (
                <p className="text-fg-3 text-[13px]">no lots yet — add your first above</p>
              )}
              {wipAggs.length > 0 && (
                <div className="flex items-center gap-4 px-1 label-caps pb-1">
                  <span>date</span>
                  <span>amount</span>
                  <span>entry</span>
                  <span>cost</span>
                </div>
              )}
              {wipAggs.map((agg) => {
                const isCollapsed = collapsed.has(agg.asset);
                return (
                  <div key={agg.asset} className="flex flex-col">
                    <AssetAggregation
                      agg={agg}
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleCollapse(agg.asset)}
                    />
                    {!isCollapsed && agg.lots.map((lot) => (
                      <LotRow key={lot.id} lot={lot} />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          {tab === 'realized' && (
            <div className="mt-2">
              {done.length === 0
                ? <p className="text-fg-3 text-[13px]">no realized lots yet</p>
                : <RealizedSummary done={done} />
              }
            </div>
          )}
        </>
      )}
    </Card>
  );
}
