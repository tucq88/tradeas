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
