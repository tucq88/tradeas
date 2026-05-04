/**
 * Agent accounting engine.
 *
 * An "agent" is an active automated strategy on a user-connected venue
 * (e.g. Lighter). Value is tracked via equity snapshots — NOT derived from
 * deposits/withdrawals alone, and NOT computed from shares × share price.
 *
 * NOTE: sharesDelta and share_price fields on LedgerTransaction are
 * intentionally ignored here. Agent positions are equity-snapshot-based only.
 */

import { D, Decimal } from '@/lib/decimal';
import type { AgentEquitySnapshot, LedgerTransaction } from '@/data/ledger/types';
import type { AgentPositionState, AccountingWarning } from './types';
import { latestAtOrBefore, isStale } from './snapshots';

const DEFAULT_STALE_AFTER_DAYS = 3;

export type ComputeAgentPositionOptions = {
  staleAfterDays?: number;
};

export function computeAgentPosition(
  transactions: LedgerTransaction[],
  equitySnapshots: AgentEquitySnapshot[],
  asOf: string,
  options: ComputeAgentPositionOptions = {},
): AgentPositionState {
  const staleAfterDays = options.staleAfterDays ?? DEFAULT_STALE_AFTER_DAYS;

  const sorted = [...transactions].sort((a, b) => {
    if (a.occurred_at < b.occurred_at) return -1;
    if (a.occurred_at > b.occurred_at) return 1;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });

  let totalDeposited = D('0');
  let totalWithdrawn = D('0');

  for (const tx of sorted) {
    if (tx.occurred_at > asOf) continue;
    // share_price and shares_delta are deliberately ignored — agent positions do not use share mechanics
    if (tx.kind === 'deposit') {
      totalDeposited = totalDeposited.add(D(tx.usdc_amount));
    } else if (tx.kind === 'withdrawal') {
      totalWithdrawn = totalWithdrawn.add(D(tx.usdc_amount));
    }
  }

  const snapshotsBeforeAsOf = equitySnapshots.filter((s) => s.snapshot_at <= asOf);
  const latestSnapshot = latestAtOrBefore(snapshotsBeforeAsOf, asOf);

  const warnings: AccountingWarning[] = [];

  if (latestSnapshot === null) {
    warnings.push({ kind: 'missing_snapshot' });
    return { totalDeposited, totalWithdrawn, currentValue: null, latestEquityAt: null, lifetimePnl: null, warnings };
  }

  if (isStale(latestSnapshot.snapshot_at, asOf, staleAfterDays)) {
    warnings.push({ kind: 'stale_snapshot', snapshotAt: latestSnapshot.snapshot_at, asOf });
  }

  const currentValue: Decimal = D(latestSnapshot.equity_usdc);
  const latestEquityAt: string = latestSnapshot.snapshot_at;
  const lifetimePnl: Decimal = currentValue.add(totalWithdrawn).sub(totalDeposited);

  return { totalDeposited, totalWithdrawn, currentValue, latestEquityAt, lifetimePnl, warnings };
}
