import { useState } from 'react';
import { Input } from '@/ui/Input';
import { MetricRow } from '@/ui/MetricRow';
import { Slider } from '@/ui/Slider';
import { InfoTooltip } from '@/ui/InfoTooltip';
import { fmtUSD, fmtNum, fmtPrice, fmtSigned } from '@/lib/format';
import { liqPrice, liqDistancePct, DEFAULT_MMR } from '@/lib/liq';
import type { ScratchpadCtx } from '../registry';

type Inputs = {
  side: 'long' | 'short';
  entry: number;
  stop: number;
  leverage: number;
  balance: number;
  riskPct: number;
};

type Result = {
  qty: number;
  notional: number;
  margin: number;
  liq: number;
  liqDistPct: number;
  r1: number;
  r2: number;
  r3: number;
  riskUsd: number;
  r1Usd: number;
  r2Usd: number;
  r3Usd: number;
} | null;

export function computeStopFirst({ side, entry, stop, leverage, balance, riskPct }: Inputs): Result {
  if (
    !Number.isFinite(entry) || entry <= 0 ||
    !Number.isFinite(stop) || stop <= 0 ||
    !Number.isFinite(leverage) || leverage <= 0 ||
    !Number.isFinite(balance) || balance <= 0 ||
    !Number.isFinite(riskPct) || riskPct <= 0
  ) return null;
  if (side === 'long' && stop >= entry) return null;
  if (side === 'short' && stop <= entry) return null;

  const riskUsd = balance * (riskPct / 100);
  const R = Math.abs(entry - stop);
  const qty = riskUsd / R;
  const notional = qty * entry;
  const margin = notional / leverage;
  const liq = liqPrice({ entry, leverage, side, mmr: DEFAULT_MMR });
  const liqDistPct = liqDistancePct({ entry, liq });
  const dir = side === 'long' ? 1 : -1;
  return {
    qty, notional, margin, liq, liqDistPct, riskUsd,
    r1: entry + dir * R,
    r2: entry + dir * 2 * R,
    r3: entry + dir * 3 * R,
    r1Usd: riskUsd,
    r2Usd: 2 * riskUsd,
    r3Usd: 3 * riskUsd,
  };
}

const D = '—';

function getErrors(side: 'long' | 'short', entry: string, stop: string, leverage: string): string[] {
  const errors: string[] = [];
  const entryNum = parseFloat(entry);
  const stopNum = parseFloat(stop);
  const levNum = parseFloat(leverage);
  if (entry !== '' && (isNaN(entryNum) || entryNum <= 0)) errors.push('Entry price must be > 0');
  if (leverage !== '' && (isNaN(levNum) || levNum <= 0)) errors.push('Leverage must be > 0');
  if (
    entry !== '' && stop !== '' &&
    !isNaN(entryNum) && entryNum > 0 &&
    !isNaN(stopNum) && stopNum > 0
  ) {
    if (side === 'long' && stopNum >= entryNum) errors.push('Stop must be below entry for long');
    if (side === 'short' && stopNum <= entryNum) errors.push('Stop must be above entry for short');
  }
  return errors;
}

export function StopFirst({ side, balance, riskPct }: ScratchpadCtx) {
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [leverage, setLeverage] = useState('10');

  const errors = getErrors(side, entry, stop, leverage);
  const out = errors.length === 0 ? computeStopFirst({
    side,
    entry: parseFloat(entry),
    stop: parseFloat(stop),
    leverage: parseFloat(leverage),
    balance,
    riskPct,
  }) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-[6px]">
          <span className="label-caps">market entry</span>
          <Input value={entry} onChange={(e) => setEntry(e.target.value)} suffix="USD" placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className="label-caps">stop</span>
          <Input value={stop} onChange={(e) => setStop(e.target.value)} suffix="USD" placeholder="0.00" />
        </div>
        <div className="col-span-2 flex flex-col gap-[6px]">
          <span className="label-caps">leverage</span>
          <Slider value={parseFloat(leverage) || 10} onChange={(v) => setLeverage(String(v))} />
        </div>
      </div>
      {errors.length > 0 && (
        <ul className="flex flex-col gap-1">
          {errors.map((e) => (
            <li key={e} className="text-loss text-[11px]">{e}</li>
          ))}
        </ul>
      )}
      {errors.length === 0 && (
        <>
          <div className="border-t border-border-1 pt-2">
            <MetricRow label="max safe size" value={out ? fmtUSD(out.notional) : D} />
            <MetricRow label="qty" value={out ? fmtNum(out.qty, 4) : D} />
            <MetricRow label="margin needed" value={out ? fmtUSD(out.margin) : D} />
            <MetricRow
              label={<><InfoTooltip text="Isolated margin liquidation price using configured MMR. Long: entry × (1 − 1/lev + MMR)" /> liq price</>}
              value={out ? fmtPrice(out.liq) : D}
              valueClassName={out ? 'text-loss' : undefined}
            />
            <MetricRow
              label={<><InfoTooltip text="Distance from current entry to liquidation price, as % of entry." /> liq dist</>}
              value={out ? fmtNum(out.liqDistPct, 2) + '%' : D}
            />
          </div>
          <div className="border-t border-border-1 pt-2">
            <MetricRow
              label="1R target"
              value={out ? fmtPrice(out.r1) : D}
              secondary={out ? fmtSigned(out.r1Usd) : undefined}
              valueClassName={out ? 'text-profit' : undefined}
            />
            <MetricRow
              label="2R target"
              value={out ? fmtPrice(out.r2) : D}
              secondary={out ? fmtSigned(out.r2Usd) : undefined}
              valueClassName={out ? 'text-profit' : undefined}
            />
            <MetricRow
              label="3R target"
              value={out ? fmtPrice(out.r3) : D}
              secondary={out ? fmtSigned(out.r3Usd) : undefined}
              valueClassName={out ? 'text-profit' : undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}
