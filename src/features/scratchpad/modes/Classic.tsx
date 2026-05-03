import { useState } from 'react';
import { Input } from '@/ui/Input';
import { MetricRow } from '@/ui/MetricRow';
import { Slider } from '@/ui/Slider';
import { fmtUSD, fmtNum, fmtPrice, fmtSigned } from '@/lib/format';
import { liqPrice, liqDistancePct, DEFAULT_MMR } from '@/lib/liq';
import { useLiqPreview } from '../lib/useLiqPreview';
import { LiqPreview } from '../components/LiqPreview';
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
  riskUsd: number;
  qty: number;
  notional: number;
  margin: number;
  liq: number;
  liqDistPct: number;
  r1: number;
  r2: number;
  r3: number;
  r1Usd: number;
  r2Usd: number;
  r3Usd: number;
} | null;

export function computeClassic({ side, entry, stop, leverage, balance, riskPct }: Inputs): Result {
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
    riskUsd, qty, notional, margin, liq, liqDistPct,
    r1: entry + dir * R,
    r2: entry + dir * 2 * R,
    r3: entry + dir * 3 * R,
    r1Usd: riskUsd,
    r2Usd: 2 * riskUsd,
    r3Usd: 3 * riskUsd,
  };
}

const D = '—';

export function Classic({ side, balance, riskPct }: ScratchpadCtx) {
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [leverage, setLeverage] = useState('10');

  const preview = useLiqPreview({ side, entry, stop, leverage });
  const out = preview.errors.length === 0 ? computeClassic({
    side,
    entry: parseFloat(entry),
    stop: parseFloat(stop),
    leverage: parseFloat(leverage) || 10,
    balance,
    riskPct,
  }) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-[6px]">
          <span className="label-caps">entry</span>
          <Input value={entry} onChange={(e) => setEntry(e.target.value)} suffix="USD" placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className="label-caps">stop</span>
          <Input
            value={stop}
            onChange={(e) => setStop(e.target.value)}
            suffix="USD"
            placeholder="0.00"
            wrapperClassName={preview.stopBeyondLiq ? 'border-loss' : undefined}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-[6px]">
          <span className="label-caps">leverage</span>
          <Slider value={parseFloat(leverage) || 10} onChange={(v) => setLeverage(String(v))} />
        </div>
      </div>
      <LiqPreview {...preview} />
      {out && (
        <>
          <div className="border-t border-border-1 pt-2">
            <MetricRow label="risk" value={fmtUSD(out.riskUsd)} />
            <MetricRow label="qty" value={fmtNum(out.qty, 4)} />
            <MetricRow label="notional" value={fmtUSD(out.notional)} />
            <MetricRow label="margin" value={fmtUSD(out.margin)} />
          </div>
          <div className="border-t border-border-1 pt-2">
            <MetricRow
              label="1R target"
              value={out.r1 > 0 ? fmtPrice(out.r1) : D}
              secondary={out.r1 > 0 ? fmtSigned(out.r1Usd) : undefined}
              valueClassName={out.r1 > 0 ? 'text-profit' : undefined}
            />
            <MetricRow
              label="2R target"
              value={out.r2 > 0 ? fmtPrice(out.r2) : D}
              secondary={out.r2 > 0 ? fmtSigned(out.r2Usd) : undefined}
              valueClassName={out.r2 > 0 ? 'text-profit' : undefined}
            />
            <MetricRow
              label="3R target"
              value={out.r3 > 0 ? fmtPrice(out.r3) : D}
              secondary={out.r3 > 0 ? fmtSigned(out.r3Usd) : undefined}
              valueClassName={out.r3 > 0 ? 'text-profit' : undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}
