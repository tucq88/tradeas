import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { perpPositions } from '@/data/perpPositions';
import { useMarkPrices } from '@/data/hooks/useMarkPrice';
import { useSettings } from '@/state/settings';
import type { PerpPosition } from '@/data/types';
import { realizedPnl } from './compute';
import { PositionRow } from './PositionRow';
import { PositionForm } from './PositionForm';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { fmtUSD, fmtPrice } from '@/lib/format';

export function PerpPanel() {
  const qc = useQueryClient();
  const [settings] = useSettings();
  const [showForm, setShowForm] = useState(false);

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

          {closed.length > 0 && (
            <ClosedSection positions={closed} />
          )}
        </>
      )}
    </Card>
  );
}

function ClosedSection({ positions }: { positions: PerpPosition[] }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border-1 pt-3 mt-1">
      <span className="label-caps">Closed</span>
      <div className="overflow-x-auto -mx-[18px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-1">
              {['Symbol', 'Side', 'Entry', 'Exit', 'Realized PnL'].map((h) => (
                <th key={h} className="py-1 px-2 label-caps font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((row) => {
              const pnl = realizedPnl(row);
              return (
                <tr key={row.id} className="border-b border-border-1">
                  <td className="py-2 px-2 font-mono text-[12px] text-fg-1">{row.symbol}</td>
                  <td className="py-2 px-2 font-mono text-[12px] text-fg-2">{row.direction}</td>
                  <td className="py-2 px-2 font-mono text-[12px] text-fg-2 tabular-nums">{fmtPrice(row.entry_price)}</td>
                  <td className="py-2 px-2 font-mono text-[12px] text-fg-2 tabular-nums">
                    {row.exit_price != null ? fmtPrice(row.exit_price) : '—'}
                  </td>
                  <td className={`py-2 px-2 font-mono text-[12px] tabular-nums ${pnl != null && pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {pnl != null ? fmtUSD(pnl) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
