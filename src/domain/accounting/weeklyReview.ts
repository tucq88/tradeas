import { D, max, min } from '@/lib/decimal';
import type { LedgerTransaction, VaultPriceSnapshot, AgentEquitySnapshot } from '@/data/ledger/types';
import type { WeeklyReviewRow, AccountingWarning } from './types';
import type { WeekStartDay } from './time';
import { weekBoundaries } from './time';
import { computeVaultPosition } from './vault';
import { computeAgentPosition } from './agent';

const WEEKLY_STALE_AFTER_DAYS = 7;

export type VaultPositionInput = {
  accountId: string;
  productId: string;
  productType: 'vault';
  transactions: LedgerTransaction[];
  snapshots: VaultPriceSnapshot[];
};

export type AgentPositionInput = {
  accountId: string;
  productId: string;
  productType: 'agent';
  transactions: LedgerTransaction[];
  equitySnapshots: AgentEquitySnapshot[];
};

export type PositionInput = VaultPositionInput | AgentPositionInput;

export type WeeklyReviewOptions = {
  asOf: string;
  weekStartDay?: WeekStartDay;
  timezone?: string;
};

export function calculateWeeklyReview(
  positions: PositionInput[],
  options: WeeklyReviewOptions,
): WeeklyReviewRow[] {
  const { asOf, weekStartDay = 'sunday', timezone = 'UTC' } = options;
  const { start, end } = weekBoundaries(asOf, { weekStartDay, timezone });

  return positions.map((pos) => computeRow(pos, { start, end, asOf }));
}

function computeRow(
  pos: PositionInput,
  { start, end, asOf }: { start: string; end: string; asOf: string },
): WeeklyReviewRow {
  const warnings: AccountingWarning[] = [];

  // Weekly cashflows: transactions in [start, end)
  const weeklyTxns = pos.transactions.filter(
    (tx) => tx.occurred_at >= start && tx.occurred_at < end,
  );
  let weeklyDeposits = D('0');
  let weeklyWithdrawals = D('0');
  for (const tx of weeklyTxns) {
    if (tx.kind === 'deposit') weeklyDeposits = weeklyDeposits.add(D(tx.usdc_amount));
    else if (tx.kind === 'withdrawal') weeklyWithdrawals = weeklyWithdrawals.add(D(tx.usdc_amount));
  }

  // Compute position state at week start (exclusive: use just before start)
  // and at asOf (= week end view)
  if (pos.productType === 'vault') {
    const startState = computeVaultPosition(pos.transactions, pos.snapshots, start);
    const endState = computeVaultPosition(pos.transactions, pos.snapshots, asOf);

    // Merge warnings from both states (deduplicate by kind)
    const seenKinds = new Set<string>();
    for (const w of [...startState.warnings, ...endState.warnings]) {
      if (!seenKinds.has(w.kind)) { seenKinds.add(w.kind); warnings.push(w); }
    }

    const startValue = startState.currentValue;
    const endValue = endState.currentValue;

    let weeklyPnl = null;
    let weeklyRoi = null;
    let suggestedTpUsdc = null;
    let suggestedTpShares = null;

    if (startValue !== null && endValue !== null) {
      weeklyPnl = endValue.add(weeklyWithdrawals).sub(weeklyDeposits).sub(startValue);
      weeklyRoi = startValue.eq(D('0')) ? null : weeklyPnl.div(startValue);

      const lifetimePnl = endState.lifetimePnl;
      if (lifetimePnl !== null) {
        const tp = max(D('0'), min(weeklyPnl, lifetimePnl));
        suggestedTpUsdc = tp;
        if (endState.latestSharePrice !== null && endState.latestSharePrice.gt(D('0'))) {
          suggestedTpShares = tp.div(endState.latestSharePrice);
        }
      }
    }

    return {
      accountId: pos.accountId,
      productId: pos.productId,
      productType: 'vault',
      startValue,
      endValue,
      weeklyDeposits,
      weeklyWithdrawals,
      weeklyPnl,
      weeklyRoi,
      suggestedTpUsdc,
      suggestedTpShares,
      lifetimePnl: endState.lifetimePnl,
      warnings,
    };
  } else {
    const startState = computeAgentPosition(
      pos.transactions, pos.equitySnapshots, start,
      { staleAfterDays: WEEKLY_STALE_AFTER_DAYS },
    );
    const endState = computeAgentPosition(
      pos.transactions, pos.equitySnapshots, asOf,
      { staleAfterDays: WEEKLY_STALE_AFTER_DAYS },
    );

    const seenKinds = new Set<string>();
    for (const w of [...startState.warnings, ...endState.warnings]) {
      if (!seenKinds.has(w.kind)) { seenKinds.add(w.kind); warnings.push(w); }
    }

    const startValue = startState.currentValue;
    const endValue = endState.currentValue;

    let weeklyPnl = null;
    let weeklyRoi = null;
    let suggestedTpUsdc = null;

    if (startValue !== null && endValue !== null) {
      weeklyPnl = endValue.add(weeklyWithdrawals).sub(weeklyDeposits).sub(startValue);
      weeklyRoi = startValue.eq(D('0')) ? null : weeklyPnl.div(startValue);

      const lifetimePnl = endState.lifetimePnl;
      if (lifetimePnl !== null) {
        suggestedTpUsdc = max(D('0'), min(weeklyPnl, lifetimePnl));
      }
    }

    return {
      accountId: pos.accountId,
      productId: pos.productId,
      productType: 'agent',
      startValue,
      endValue,
      weeklyDeposits,
      weeklyWithdrawals,
      weeklyPnl,
      weeklyRoi,
      suggestedTpUsdc,
      suggestedTpShares: null, // agents are not share-based
      lifetimePnl: endState.lifetimePnl,
      warnings,
    };
  }
}
