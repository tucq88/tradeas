import type { PerpPosition } from '@/data/types';
import { summarizeClosed } from './aggregate';
import { fmtSigned, fmtPrice, fmtPct } from '@/lib/format';

type Props = { positions: PerpPosition[] };

function pnlClass(n: number): string {
  return n >= 0 ? 'text-profit' : 'text-loss';
}

export function PerpRealizedSummary({ positions }: Props) {
  const summary = summarizeClosed(positions);

  if (summary.count === 0) {
    return <p className="text-fg-3 text-[13px]">no realized trades yet</p>;
  }

  const { rows, totalPnl, avgPnl, bestPnl, worstPnl, count, wins, winRate } = summary;

  return (
    <div className="flex flex-col gap-3">
      {/* Summary strip */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border-1 pt-3 mt-1">
        <div className="flex flex-col gap-0.5">
          <span className="label-caps">Total PnL</span>
          <span className={`font-mono text-[12px] tabular-nums ${pnlClass(totalPnl)}`}>
            {fmtSigned(totalPnl)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="label-caps">Win rate</span>
          <span className="font-mono text-[12px] tabular-nums text-fg-1">
            {(winRate * 100).toFixed(0)}% ({wins}/{count})
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="label-caps">N trades</span>
          <span className="font-mono text-[12px] tabular-nums text-fg-1">{count}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="label-caps">Avg</span>
          <span className={`font-mono text-[12px] tabular-nums ${pnlClass(avgPnl)}`}>
            {fmtSigned(avgPnl)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="label-caps">Best</span>
          <span className={`font-mono text-[12px] tabular-nums ${pnlClass(bestPnl)}`}>
            {fmtSigned(bestPnl)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="label-caps">Worst</span>
          <span className={`font-mono text-[12px] tabular-nums ${pnlClass(worstPnl)}`}>
            {fmtSigned(worstPnl)}
          </span>
        </div>
      </div>

      {/* Flat table */}
      <div className="overflow-x-auto -mx-[18px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-1">
              {['Symbol', 'Side', 'Lev', 'Size', 'Entry', 'Exit', 'PnL', 'ROI%', 'Closed'].map((h) => (
                <th key={h} className="py-1 px-2 label-caps font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ position: p, pnl, roi }) => (
              <tr key={p.id} className="border-b border-border-1">
                <td className="py-2 px-2 font-mono text-[12px] text-fg-1">{p.symbol}</td>
                <td className="py-2 px-2 font-mono text-[12px] text-fg-2">{p.direction}</td>
                <td className="py-2 px-2 font-mono text-[12px] text-fg-2 tabular-nums">{p.leverage}x</td>
                <td className="py-2 px-2 font-mono text-[12px] text-fg-2 tabular-nums">${p.size_usdt}</td>
                <td className="py-2 px-2 font-mono text-[12px] text-fg-2 tabular-nums">{fmtPrice(p.entry_price)}</td>
                <td className="py-2 px-2 font-mono text-[12px] text-fg-2 tabular-nums">
                  {p.exit_price != null ? fmtPrice(p.exit_price) : '—'}
                </td>
                <td className={`py-2 px-2 font-mono text-[12px] tabular-nums ${pnlClass(pnl)}`}>
                  {fmtSigned(pnl)}
                </td>
                <td className={`py-2 px-2 font-mono text-[12px] tabular-nums ${pnlClass(roi)}`}>
                  {fmtPct(roi * 100)}
                </td>
                <td className="py-2 px-2 font-mono text-[12px] text-fg-3 tabular-nums">
                  {p.closed_at ? p.closed_at.slice(0, 10) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
