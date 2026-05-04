import { useState } from 'react';
import type { PositionState } from '@/data/hooks/useLedgerPositions';
import { PositionStatusBadge } from './PositionStatusBadge';

type SortKey = 'currentValue' | 'lifetimePnl' | 'withdrawableNow';
type SortDir = 'asc' | 'desc';

type Props = {
  positions: PositionState[];
  onAddSnapshot?: (productId: string) => void;
};

function numVal(p: PositionState, key: SortKey): number {
  const v = p[key];
  return v !== null ? v.toNumber() : -Infinity;
}

function sortPositions(positions: PositionState[], key: SortKey, dir: SortDir): PositionState[] {
  return [...positions].sort((a, b) => {
    const av = numVal(a, key);
    const bv = numVal(b, key);
    return dir === 'desc' ? bv - av : av - bv;
  });
}

type ColHeader = { label: string; key?: SortKey; cls?: string };

const COLUMNS: ColHeader[] = [
  { label: 'Account' },
  { label: 'Product' },
  { label: 'Type' },
  { label: 'Shares', cls: 'text-right' },
  { label: 'SP / Equity', cls: 'text-right' },
  { label: 'Value', key: 'currentValue', cls: 'text-right' },
  { label: 'Deposited', cls: 'text-right' },
  { label: 'Withdrawn', cls: 'text-right' },
  { label: 'PnL', key: 'lifetimePnl', cls: 'text-right' },
  { label: 'Withdrawable', key: 'withdrawableNow', cls: 'text-right' },
  { label: 'Status' },
];

export function PositionsTable({ positions, onAddSnapshot }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('currentValue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = sortPositions(positions, sortKey, sortDir);

  if (sorted.length === 0) {
    return <p className="text-fg-3 text-[13px]">no positions — add transactions to see them here</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border-1">
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                className={`py-1 px-2 text-fg-3 text-[10px] uppercase tracking-wide font-medium whitespace-nowrap ${col.cls ?? ''}`}
              >
                {col.key ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key!)}
                    className="hover:text-fg-1 transition-colors"
                  >
                    {col.label}
                    {sortKey === col.key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((pos) => {
            const hasMissingSnapshot = pos.warnings.some((w) => w.kind === 'missing_snapshot');
            return (
              <tr key={`${pos.accountId}:${pos.productId}`} className="border-b border-border-1 hover:bg-bg-inset/40">
                <td className="py-1.5 px-2 text-[12px] text-fg-1">{pos.accountName}</td>
                <td className="py-1.5 px-2 text-[12px] text-fg-1">{pos.productName}</td>
                <td className="py-1.5 px-2 text-[11px] text-fg-3 capitalize">{pos.productType}</td>
                <td className="py-1.5 px-2 text-[12px] text-right tabular-nums">
                  {pos.sharesHeld !== null ? pos.sharesHeld.toFixed(6) : '—'}
                </td>
                <td className="py-1.5 px-2 text-[12px] text-right tabular-nums">
                  {pos.productType === 'vault' && pos.latestSharePrice !== null
                    ? pos.latestSharePrice.toFixed(4)
                    : pos.productType === 'agent' && pos.currentValue !== null
                    ? pos.currentValue.toFixed(2)
                    : '—'}
                </td>
                <td className="py-1.5 px-2 text-[12px] text-right tabular-nums">
                  {pos.currentValue !== null ? pos.currentValue.toFixed(2) : '—'}
                </td>
                <td className="py-1.5 px-2 text-[12px] text-right tabular-nums">
                  {pos.totalDeposited.toFixed(2)}
                </td>
                <td className="py-1.5 px-2 text-[12px] text-right tabular-nums">
                  {pos.totalWithdrawn.toFixed(2)}
                </td>
                <td className={`py-1.5 px-2 text-[12px] text-right tabular-nums ${
                  pos.lifetimePnl !== null
                    ? pos.lifetimePnl.gte(0) ? 'text-gain' : 'text-loss'
                    : ''
                }`}>
                  {pos.lifetimePnl !== null ? pos.lifetimePnl.toFixed(2) : '—'}
                </td>
                <td className="py-1.5 px-2 text-[12px] text-right tabular-nums">
                  {pos.withdrawableNow !== null ? pos.withdrawableNow.toFixed(2) : '—'}
                </td>
                <td className="py-1.5 px-2">
                  <div className="flex items-center gap-1.5">
                    <PositionStatusBadge position={pos} />
                    {hasMissingSnapshot && onAddSnapshot && (
                      <button
                        type="button"
                        onClick={() => onAddSnapshot(pos.productId)}
                        className="text-[11px] text-accent hover:underline"
                      >
                        → add snapshot
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
