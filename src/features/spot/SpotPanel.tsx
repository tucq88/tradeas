import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { spotLots } from '@/data/spotLots';
import type { SpotLot } from '@/data/types';
import { useCoinList } from '@/data/hooks/useCoinList';
import { useCoingeckoPrices } from '@/data/hooks/useCoingeckoPrices';
import { useLastRefreshed } from '@/data/hooks/useLastRefreshed';
import { parseCsv, serializeLots, downloadCsv } from '@/lib/csv';
import type { ParseResult } from '@/lib/csv';
import { aggregateWip } from './aggregate';
import { useCoingeckoBackfill } from './useCoingeckoBackfill';
import { UnmappedAssetBanner } from './UnmappedAssetBanner';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Tabs } from '@/ui/Tabs';
import { LotForm } from './LotForm';
import { LotRow } from './LotRow';
import { AssetAggregation } from './AssetAggregation';
import { RealizedSummary } from './RealizedSummary';
import { ImportPreviewModal } from './ImportPreviewModal';

const TABS = [
  { id: 'wip', label: 'WIP' },
  { id: 'realized', label: 'Realized' },
];

export function SpotPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'wip' | 'realized'>('wip');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: lots = [],
    isLoading,
    isError,
  } = useQuery<SpotLot[]>({
    queryKey: ['spot-lots'],
    queryFn: () => spotLots.list(),
  });

  const { data: coinList } = useCoinList();

  const wip = lots.filter((l) => l.status === 'wip');
  const done = lots.filter((l) => l.status === 'done');

  const uniqueIds = [...new Set(
    wip.map((l) => l.coingecko_id).filter((id): id is string => id !== null),
  )];
  const { data: priceMap = {} } = useCoingeckoPrices(uniqueIds);
  const heldIds = uniqueIds;

  const lastRefreshed = useLastRefreshed();
  const wipAggs = aggregateWip(wip, priceMap);
  const { unresolved } = useCoingeckoBackfill(wip);

  const handleRefresh = () => {
    void qc.invalidateQueries({ queryKey: ['spot-lots'] });
    void qc.invalidateQueries({ queryKey: ['coingecko', 'prices'] });
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

  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const csv = serializeLots(lots.map((l) => ({
      asset: l.asset, date: l.date, amount: l.amount, entry_price: l.entry_price,
      cost_usd: l.cost_usd, status: l.status, exit_price: l.exit_price, exit_date: l.exit_date,
    })));
    downloadCsv(csv, `spot-lots-${today}.csv`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;
      setPreview(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const handleModalClose = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button onClick={() => fileInputRef.current?.click()}>import</Button>
                <Button onClick={handleExport} disabled={lots.length === 0}>export</Button>
              </div>
              <UnmappedAssetBanner lots={unresolved} coinList={coinList} heldIds={heldIds} />
              <LotForm heldIds={heldIds} />
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
                      <LotRow key={lot.id} lot={lot} heldIds={heldIds} />
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
      {preview && (
        <ImportPreviewModal
          valid={preview.valid}
          errors={preview.errors}
          onClose={handleModalClose}
        />
      )}
    </Card>
  );
}
