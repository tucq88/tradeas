import { MetricRow } from '@/ui/MetricRow';
import { InfoTooltip } from '@/ui/InfoTooltip';
import { fmtNum, fmtPrice } from '@/lib/format';
import type { LiqPreview as LiqPreviewState } from '../lib/useLiqPreview';

export function LiqPreview({ errors, hasBase, baseLiq, baseLiqDist, stopBeyondLiq }: LiqPreviewState) {
  return (
    <>
      {errors.length > 0 && (
        <ul className="flex flex-col gap-1">
          {errors.map((e) => (
            <li key={e} className="text-loss text-[11px]">{e}</li>
          ))}
        </ul>
      )}
      {hasBase && baseLiq !== null && baseLiqDist !== null && (
        <div className="border-t border-border-1 pt-2">
          <MetricRow
            label={<><InfoTooltip text="Isolated margin liquidation price using configured MMR. Long: entry × (1 − 1/lev + MMR). Short: entry × (1 + 1/lev − MMR)" /> liq price</>}
            value={fmtPrice(baseLiq)}
            valueClassName="text-loss"
          />
          {stopBeyondLiq && (
            <p className="text-loss text-[11px] mt-1">
              Stop is beyond liq — stop won't trigger before liquidation
            </p>
          )}
          <MetricRow
            label={<><InfoTooltip text="Distance from current entry to liquidation price, as % of entry." /> liq dist</>}
            value={fmtNum(baseLiqDist, 2) + '%'}
          />
        </div>
      )}
    </>
  );
}
