import type { Decimal } from '@/lib/decimal';

// -------------------------------------------------------------------
// Warning union — consumed by UI and (future) AI coach
// -------------------------------------------------------------------

export type AccountingWarning =
  | { kind: 'missing_snapshot' }
  | { kind: 'stale_snapshot'; snapshotAt: string; asOf: string }
  | { kind: 'over_withdraw'; sharesAttempted: Decimal; sharesHeld: Decimal }
  | { kind: 'negative_shares'; sharesHeld: Decimal };

// -------------------------------------------------------------------
// Vault position state — result of computeVaultPosition()
// -------------------------------------------------------------------

export type VaultPositionState = {
  /** Running shares held after processing all transactions up to asOf */
  sharesHeld: Decimal;
  /** Sum of all deposit usdc_amount values */
  totalDeposited: Decimal;
  /** Sum of all withdrawal usdc_amount values */
  totalWithdrawn: Decimal;
  /** Share price from the latest snapshot at-or-before asOf; null if missing */
  latestSharePrice: Decimal | null;
  /** sharesHeld × latestSharePrice; null when latestSharePrice is null */
  currentValue: Decimal | null;
  /** currentValue + totalWithdrawn − totalDeposited; null when currentValue is null */
  lifetimePnl: Decimal | null;
  warnings: AccountingWarning[];
};

// -------------------------------------------------------------------
// Agent position state — result of computeAgentPosition()
// -------------------------------------------------------------------

export type AgentPositionState = {
  /** Sum of all deposit transaction amounts */
  totalDeposited: Decimal;
  /** Sum of all withdrawal transaction amounts */
  totalWithdrawn: Decimal;
  /** equity_usdc from the latest equity snapshot at or before asOf */
  currentValue: Decimal | null;
  /** snapshot_at of the equity snapshot used for currentValue */
  latestEquityAt: string | null;
  /** lifetimePnl = currentValue + totalWithdrawn - totalDeposited; null when currentValue is null */
  lifetimePnl: Decimal | null;
  warnings: AccountingWarning[];
};

// -------------------------------------------------------------------
// Weekly review row — result of calculateWeeklyReview()
// -------------------------------------------------------------------

export type WeekStartDay = 'sunday' | 'monday';

export type WeeklyReviewRow = {
  accountId: string;
  productId: string;
  productType: 'vault' | 'agent';
  /** Position value at week start; null when snapshot missing */
  startValue: Decimal | null;
  /** Position value at week end (= asOf); null when snapshot missing */
  endValue: Decimal | null;
  /** Sum of deposit amounts in [weekStart, weekEnd) */
  weeklyDeposits: Decimal;
  /** Sum of withdrawal amounts in [weekStart, weekEnd) */
  weeklyWithdrawals: Decimal;
  /** endValue + weeklyWithdrawals - weeklyDeposits - startValue; null when start/end missing */
  weeklyPnl: Decimal | null;
  /** weeklyPnl / startValue; null when start/end missing or startValue is zero */
  weeklyRoi: Decimal | null;
  /** max(0, min(weeklyPnl, currentValue - totalDeposited)); null when weeklyPnl is null */
  suggestedTpUsdc: Decimal | null;
  /** suggestedTpUsdc / latestSharePrice; null for agent rows or when share price missing */
  suggestedTpShares: Decimal | null;
  /** Lifetime PnL from the position state */
  lifetimePnl: Decimal | null;
  warnings: AccountingWarning[];
};

// -------------------------------------------------------------------
// Withdrawal classification — profit-first waterfall
// -------------------------------------------------------------------

export type WithdrawalClassification = {
  /** max(0, valueBeforeWithdrawal − depositsBeforeWithdrawal) */
  availableProfit: Decimal;
  /** min(withdrawalAmount, availableProfit) */
  realizedProfit: Decimal;
  /** max(0, withdrawalAmount − realizedProfit) */
  principalTouched: Decimal;
};
