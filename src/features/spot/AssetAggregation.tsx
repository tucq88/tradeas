import type { AssetAgg } from './aggregate';
import { fmtUSD, fmtPct, fmtSigned, fmtPrice, fmtNum } from '@/lib/format';
import { TokenLogo } from '@/ui/TokenLogo';

type Props = {
  agg: AssetAgg;
  isCollapsed: boolean;
  onToggle: () => void;
};

export function AssetAggregation({ agg, isCollapsed, onToggle }: Props) {
  const pnlColor =
    agg.unrealizedPnl === null
      ? 'text-fg-3'
      : agg.unrealizedPnl >= 0
        ? 'text-profit'
        : 'text-loss';

  return (
    <div className="flex items-center justify-between bg-bg-2 px-3 py-2 rounded-sm text-[12px]">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-fg-1 cursor-pointer"
      >
        <span className="text-fg-3 font-mono text-[10px] w-2 shrink-0">
          {isCollapsed ? '▸' : '▾'}
        </span>
        <TokenLogo symbol={agg.asset} src={agg.image} />
        <span className="font-sans font-semibold uppercase tracking-wider text-[11px]">
          {agg.asset}
        </span>
        <span className="text-fg-3 font-normal text-[11px]">
          {agg.lots.length} lot{agg.lots.length !== 1 ? 's' : ''}
        </span>
      </button>
      <div className="flex items-center gap-5 font-mono">
        <div className="flex flex-col items-end gap-[2px]">
          <span className="text-fg-3 text-[10px] uppercase tracking-wide">amount</span>
          <span className="text-fg-2">{fmtNum(agg.totalAmount, 4)}</span>
        </div>
        <div className="flex flex-col items-end gap-[2px]">
          <span className="text-fg-3 text-[10px] uppercase tracking-wide">avg cost</span>
          <span className="text-fg-2">{fmtPrice(agg.weightedAvgCost)}</span>
        </div>
        <div className="flex flex-col items-end gap-[2px]">
          <span className="text-fg-3 text-[10px] uppercase tracking-wide">invested</span>
          <span className="text-fg-2">{fmtUSD(agg.totalInvested)}</span>
        </div>
        <div className="flex flex-col items-end gap-[2px]">
          <span className="text-fg-3 text-[10px] uppercase tracking-wide">value</span>
          <span className="text-fg-1">
            {agg.currentValue !== null ? fmtUSD(agg.currentValue) : '—'}
          </span>
          {agg.currentValue === null && (
            <span className="text-fg-3 text-[10px]">price unavailable</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-[2px]">
          <span className="text-fg-3 text-[10px] uppercase tracking-wide">pnl</span>
          <span className={pnlColor}>
            {agg.unrealizedPnl !== null ? fmtSigned(agg.unrealizedPnl, 0) : '—'}
            {agg.pctDelta !== null && (
              <span className="ml-1 text-[11px]">{fmtPct(agg.pctDelta * 100)}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
