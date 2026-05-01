import { useState } from 'react';
import type { PerpPosition } from '@/data/types';
import type { Settings } from '@/state/settings';
import { effectiveMmr, unrealizedPnl, computeLiqDistance, isLiqWarn } from './compute';
import { liqPrice } from '@/lib/liq';
import { fmtPrice, fmtUSD, fmtPct } from '@/lib/format';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { PositionForm } from './PositionForm';
import { CloseDialog } from './CloseDialog';

type Props = {
  row: PerpPosition;
  markPrice: number | undefined;
  settings: Settings;
};

export function PositionRow({ row, markPrice, settings }: Props) {
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);

  const mmr = effectiveMmr(row, settings);

  const liq = liqPrice({ entry: row.entry_price, leverage: row.leverage, side: row.direction, mmr });
  const pnl = markPrice !== undefined ? unrealizedPnl(row, markPrice) : null;
  const liqDist = markPrice !== undefined ? computeLiqDistance(row, markPrice, mmr) : null;
  const warn = liqDist !== null && isLiqWarn(liqDist);

  if (editing) {
    return (
      <tr>
        <td colSpan={8} className="py-1">
          <PositionForm initial={row} onDone={() => setEditing(false)} />
        </td>
      </tr>
    );
  }

  if (closing) {
    return (
      <tr>
        <td colSpan={8} className="py-1">
          <CloseDialog position={row} onDone={() => setClosing(false)} />
        </td>
      </tr>
    );
  }

  const pnlPct = pnl !== null ? (pnl / row.size_usdt) * 100 : null;

  return (
    <tr className="border-b border-border-1 hover:bg-bg-3 transition-colors">
      <td className="py-2 px-2 font-mono text-[12px] text-fg-1">{row.symbol}</td>
      <td className="py-2 px-2">
        <Badge kind={row.direction}>
          {row.direction} {row.leverage}x
        </Badge>
      </td>
      <td className="py-2 px-2 font-mono text-[12px] text-fg-2 tabular-nums">
        {fmtPrice(row.entry_price)}
      </td>
      <td className="py-2 px-2 font-mono text-[12px] tabular-nums">
        {markPrice !== undefined ? fmtPrice(markPrice) : '—'}
      </td>
      <td className="py-2 px-2 font-mono text-[12px] text-fg-2 tabular-nums">
        {fmtUSD(row.size_usdt, 0)}
      </td>
      <td className="py-2 px-2 font-mono text-[12px] tabular-nums">
        {pnl !== null ? (
          <span className={pnl >= 0 ? 'text-profit' : 'text-loss'}>
            {fmtUSD(pnl, 0)} ({fmtPct(pnlPct!)})
          </span>
        ) : '—'}
      </td>
      <td className="py-2 px-2 font-mono text-[12px] tabular-nums">
        {fmtPrice(liq)}
      </td>
      <td className={`py-2 px-2 font-mono text-[12px] tabular-nums ${warn ? 'text-[var(--warn)]' : 'text-fg-2'}`}>
        {liqDist !== null ? fmtPct(liqDist * 100) : '—'}
      </td>
      <td className="py-2 px-2">
        <div className="flex gap-1">
          <Button className="h-6 px-2 text-[11px]" onClick={() => setEditing(true)}>Edit</Button>
          <Button className="h-6 px-2 text-[11px] text-loss hover:text-loss" onClick={() => setClosing(true)}>Close</Button>
        </div>
      </td>
    </tr>
  );
}
