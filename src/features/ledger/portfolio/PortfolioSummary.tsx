import { D, max } from '@/lib/decimal';
import type { Decimal } from '@/lib/decimal';
import type { PositionState } from '@/data/hooks/useLedgerPositions';

type KpiValue = Decimal | null;

type Kpis = {
  totalExposure: KpiValue;
  totalDeposited: Decimal;
  totalWithdrawn: Decimal;
  lifetimePnl: KpiValue;
  withdrawableNow: KpiValue;
  cashRecoveredPct: KpiValue;
  houseMoneyCount: number;
};

function aggregateKpis(positions: PositionState[]): Kpis {
  let totalExposure: Decimal | null = null;
  let totalDeposited = D(0);
  let totalWithdrawn = D(0);
  let lifetimePnl: Decimal | null = null;
  let withdrawableNow: Decimal | null = null;
  let houseMoneyCount = 0;

  for (const pos of positions) {
    if (pos.currentValue !== null) {
      totalExposure = (totalExposure ?? D(0)).add(pos.currentValue);
    }
    totalDeposited = totalDeposited.add(pos.totalDeposited);
    totalWithdrawn = totalWithdrawn.add(pos.totalWithdrawn);

    if (pos.lifetimePnl !== null) {
      lifetimePnl = (lifetimePnl ?? D(0)).add(pos.lifetimePnl);
    }

    if (pos.currentValue !== null) {
      const posWithdrawable = max(D(0), pos.currentValue.sub(pos.totalDeposited));
      withdrawableNow = (withdrawableNow ?? D(0)).add(posWithdrawable);
    }

    if (pos.totalWithdrawn.gte(pos.totalDeposited) && pos.totalDeposited.gt(D(0))) {
      houseMoneyCount += 1;
    }
  }

  const cashRecoveredPct = totalDeposited.gt(D(0))
    ? totalWithdrawn.div(totalDeposited).mul(D(100))
    : null;

  return {
    totalExposure,
    totalDeposited,
    totalWithdrawn,
    lifetimePnl,
    withdrawableNow,
    cashRecoveredPct,
    houseMoneyCount,
  };
}

type KpiTileProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function KpiTile({ label, value, accent }: KpiTileProps) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[120px]">
      <span className="text-fg-3 text-[10px] uppercase tracking-wide">{label}</span>
      <span className={`text-[15px] font-medium tabular-nums ${accent ? 'text-gain' : 'text-fg-1'}`}>
        {value}
      </span>
    </div>
  );
}

type Props = {
  positions: PositionState[];
};

export function PortfolioSummary({ positions }: Props) {
  const kpis = aggregateKpis(positions);

  const fmt = (v: Decimal | null) =>
    v !== null ? `$${v.toFixed(2)}` : '—';

  const fmtPct = (v: Decimal | null) =>
    v !== null ? `${v.toFixed(2)}%` : '—';

  const pnlPositive = kpis.lifetimePnl !== null && kpis.lifetimePnl.gte(D(0));

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 py-3 border-b border-border-1 mb-4">
      <KpiTile label="Exposure" value={fmt(kpis.totalExposure)} />
      <KpiTile label="Deposited" value={fmt(kpis.totalDeposited)} />
      <KpiTile label="Withdrawn" value={fmt(kpis.totalWithdrawn)} />
      <KpiTile
        label="Lifetime PnL"
        value={kpis.lifetimePnl !== null ? `$${kpis.lifetimePnl.toFixed(2)}` : '—'}
        accent={pnlPositive}
      />
      <KpiTile label="Withdrawable" value={fmt(kpis.withdrawableNow)} accent />
      <KpiTile label="Cash recovered" value={fmtPct(kpis.cashRecoveredPct)} />
      <KpiTile label="House money" value={`${kpis.houseMoneyCount} pos`} />
    </div>
  );
}
