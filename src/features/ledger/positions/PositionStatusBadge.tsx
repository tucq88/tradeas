import type { AccountingWarning } from '@/domain/accounting/types';
import type { PositionState } from '@/data/hooks/useLedgerPositions';
import { D } from '@/lib/decimal';

export type StatusKind =
  | 'tp available'
  | 'below principal floor'
  | 'house money'
  | 'missing snapshot'
  | 'stale snapshot'
  | 'no tp';

export function resolveStatus(position: PositionState): StatusKind {
  const { warnings, currentValue, totalDeposited, totalWithdrawn, withdrawableNow } = position;

  if (warnings.some((w: AccountingWarning) => w.kind === 'missing_snapshot')) return 'missing snapshot';
  if (warnings.some((w: AccountingWarning) => w.kind === 'stale_snapshot')) return 'stale snapshot';

  if (currentValue === null) return 'missing snapshot';

  if (totalWithdrawn.gte(totalDeposited)) return 'house money';

  if (currentValue.lt(totalDeposited)) return 'below principal floor';

  if (withdrawableNow !== null && withdrawableNow.gt(D(0))) return 'tp available';

  return 'no tp';
}

const STATUS_STYLES: Record<StatusKind, string> = {
  'tp available': 'bg-gain/10 text-gain border border-gain/30',
  'below principal floor': 'bg-loss/10 text-loss border border-loss/30',
  'house money': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  'missing snapshot': 'bg-loss/10 text-loss border border-loss/30',
  'stale snapshot': 'bg-fg-3/10 text-fg-3 border border-fg-3/20',
  'no tp': 'bg-fg-3/10 text-fg-3 border border-fg-3/20',
};

type Props = {
  position: PositionState;
};

export function PositionStatusBadge({ position }: Props) {
  const status = resolveStatus(position);
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}
