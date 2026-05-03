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
  sizeUsdt: number;
  balance: number;
};

type Result = {
  qty: number;
  riskUsd: number;
  riskPctOfBalance: number;
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

export function computeSizeFirst({ side, entry, stop, leverage, sizeUsdt, balance }: Inputs): Result {
  if (
    !Number.isFinite(entry) || entry <= 0 ||
    !Number.isFinite(stop) || stop <= 0 ||
    !Number.isFinite(leverage) || leverage <= 0 ||
    !Number.isFinite(sizeUsdt) || sizeUsdt <= 0 ||
    !Number.isFinite(balance) || balance <= 0
  ) return null;
  if (side === 'long' && stop >= entry) return null;
  if (side === 'short' && stop <= entry) return null;

  const qty = sizeUsdt / entry;
  const R = Math.abs(entry - stop);
  const riskUsd = qty * R;
  const riskPctOfBalance = (riskUsd / balance) * 100;
  const margin = sizeUsdt / leverage;
  const liq = liqPrice({ entry, leverage, side, mmr: DEFAULT_MMR });
  const liqDistPct = liqDistancePct({ entry, liq });
  const dir = side === 'long' ? 1 : -1;
  return {
    qty, riskUsd, riskPctOfBalance, margin, liq, liqDistPct,
    r1: entry + dir * R,
    r2: entry + dir * 2 * R,
    r3: entry + dir * 3 * R,
    r1Usd: riskUsd,
    r2Usd: 2 * riskUsd,
    r3Usd: 3 * riskUsd,
  };
}

const D = '—';

export function SizeFirst({ side, balance }: ScratchpadCtx) {
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [leverage, setLeverage] = useState('10');
  const [sizeUsdt, setSizeUsdt] = useState('');

  const preview = useLiqPreview({ side, entry, stop, leverage });
  const out = preview.errors.length === 0 ? computeSizeFirst({
    side,
    entry: parseFloat(entry),
    stop: parseFloat(stop),
    leverage: parseFloat(leverage) || 10,
    sizeUsdt: parseFloat(sizeUsdt),
    balance,
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
        <div className="flex flex-col gap-[6px]">
          <span className="label-caps">size</span>
          <Input value={sizeUsdt} onChange={(e) => setSizeUsdt(e.target.value)} suffix="USDT" placeholder="0.00" />
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
            <MetricRow label="qty" value={fmtNum(out.qty, 4)} />
            <MetricRow label="actual risk" value={fmtUSD(out.riskUsd)} valueClassName="text-warn" />
            <MetricRow label="risk % of balance" value={fmtNum(out.riskPctOfBalance, 2) + '%'} />
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
