import type { SpotLot } from '@/data/types';
import { aggregateDone } from './aggregate';
import { fmtSigned, fmtPrice, fmtNum } from '@/lib/format';

type Props = { done: SpotLot[] };

export function RealizedSummary({ done }: Props) {
  const groups = aggregateDone(done);
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-border-1 pt-3 mt-1">
      <p className="text-fg-3 text-[10px] uppercase tracking-wider font-medium">realized</p>
      {groups.map(({ asset, realizedPnl, lots }) => (
        <div key={asset}>
          <div className="flex items-center justify-between text-[12px] py-1">
            <span className="font-sans font-semibold text-fg-1 uppercase tracking-wide text-[11px]">
              {asset}
            </span>
            <span className={`font-mono ${realizedPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {fmtSigned(realizedPnl, 0)}
            </span>
          </div>
          {lots.map((lot) => {
            const ep = lot.exit_price != null ? Number(lot.exit_price) : null;
            const lotPnl = ep != null ? (ep - Number(lot.entry_price)) * Number(lot.amount) : null;
            return (
              <div
                key={lot.id}
                className="flex items-center justify-between text-[11px] py-1 pl-3"
              >
                <span className="text-fg-3 font-mono">
                  {lot.date} · {fmtNum(Number(lot.amount), 6)} ·{' '}
                  {fmtPrice(Number(lot.entry_price))} →{' '}
                  {ep != null ? fmtPrice(ep) : '—'}
                </span>
                {lotPnl != null && (
                  <span
                    className={`font-mono ${lotPnl >= 0 ? 'text-profit' : 'text-loss'}`}
                  >
                    {fmtSigned(lotPnl, 0)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
