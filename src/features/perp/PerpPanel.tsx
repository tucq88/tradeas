import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { perpPositions } from '@/data/perpPositions';
import { useMarkPrices } from '@/data/hooks/useMarkPrice';
import { useSettings } from '@/state/settings';
import { PositionRow } from './PositionRow';
import { PositionForm } from './PositionForm';
import { PerpRealizedSummary } from './PerpRealizedSummary';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Tabs } from '@/ui/Tabs';

const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'realized', label: 'Realized' },
];

export function PerpPanel() {
  const qc = useQueryClient();
  const [settings] = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'open' | 'realized'>('open');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['perp-positions'],
    queryFn: perpPositions.list,
  });

  const open = (data ?? []).filter((p) => p.status === 'open');
  const closed = (data ?? []).filter((p) => p.status === 'closed');
  const openSymbols = [...new Set(open.map((p) => p.symbol))];

  const { data: markPrices } = useMarkPrices(openSymbols);

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: ['perp-positions'] });
    qc.invalidateQueries({ queryKey: ['binance', 'futures', 'mark', 'all'] });
  }

  const refreshAction = (
    <Button className="h-7 px-3 text-[11px]" onClick={handleRefresh}>
      Refresh
    </Button>
  );

  return (
    <Card title="perp positions" count={open.length || undefined} action={refreshAction}>
      {isLoading && <p className="text-fg-3 text-[13px]">loading…</p>}
      {isError && <p className="text-loss text-[13px]">failed to load positions</p>}

      {!isLoading && !isError && (
        <>
          <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as 'open' | 'realized')} />

          {tab === 'open' && (
            <div className="flex flex-col gap-2 mt-2">
              {open.length === 0 && !showForm && (
                <p className="text-fg-3 text-[13px]">no open positions</p>
              )}

              {open.length > 0 && (
                <div className="overflow-x-auto -mx-[18px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-1">
                        {['Symbol', 'Side', 'Entry', 'Mark', 'Size', 'PnL', 'Liq', 'Dist%'].map((h) => (
                          <th key={h} className="py-1 px-2 label-caps font-medium">{h}</th>
                        ))}
                        <th className="py-1 px-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {open.map((row) => (
                        <PositionRow
                          key={row.id}
                          row={row}
                          markPrice={markPrices?.[row.symbol]}
                          settings={settings}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showForm ? (
                <PositionForm onDone={() => setShowForm(false)} />
              ) : (
                <Button className="self-start" onClick={() => setShowForm(true)}>
                  + Add Position
                </Button>
              )}
            </div>
          )}

          {tab === 'realized' && (
            <div className="mt-2">
              <PerpRealizedSummary positions={closed} />
            </div>
          )}
        </>
      )}
    </Card>
  );
}
