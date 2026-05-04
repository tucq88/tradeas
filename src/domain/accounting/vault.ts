import { D, max } from '@/lib/decimal';
import type { LedgerTransaction, VaultPriceSnapshot } from '@/data/ledger/types';
import type { AccountingWarning, VaultPositionState } from './types';
import { latestAtOrBefore } from './snapshots';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Sort transactions by occurred_at ascending, tiebreak by id ascending. */
function sortTransactions(txns: LedgerTransaction[]): LedgerTransaction[] {
  return [...txns].sort((a, b) => {
    if (a.occurred_at !== b.occurred_at) {
      return a.occurred_at < b.occurred_at ? -1 : 1;
    }
    return a.id < b.id ? -1 : 1;
  });
}

/**
 * Resolve the shares delta for a deposit or withdrawal.
 *
 * Priority:
 *   1. Use stored shares_delta if present and non-empty.
 *   2. Otherwise compute: usdcAmount / sharePrice at the transaction's share_price.
 *
 * Returns null when no share price can be determined (caller must decide how
 * to handle the transaction).
 */
function resolveSharesDelta(tx: LedgerTransaction): {
  delta: ReturnType<typeof D> | null;
  usedSharePrice: ReturnType<typeof D> | null;
} {
  if (tx.shares_delta !== null && tx.shares_delta !== '') {
    return { delta: D(tx.shares_delta), usedSharePrice: null };
  }
  if (tx.share_price !== null && tx.share_price !== '') {
    const sp = D(tx.share_price);
    const amount = D(tx.usdc_amount);
    return { delta: amount.div(sp), usedSharePrice: sp };
  }
  return { delta: null, usedSharePrice: null };
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Compute the vault position state deterministically from raw events.
 *
 * Caller responsibilities:
 *   - Filter out archived transactions (archived_at !== null) before calling.
 *   - Filter out archived snapshots (archived_at !== null) before calling.
 *   - Pass only transactions belonging to the product being computed.
 *
 * @param transactions - All non-archived LedgerTransactions for this product.
 * @param snapshots    - All non-archived VaultPriceSnapshots for this product.
 * @param asOf         - ISO 8601 string. Only transactions where occurred_at <= asOf
 *                       are included.
 */
export function computeVaultPosition(
  transactions: LedgerTransaction[],
  snapshots: VaultPriceSnapshot[],
  asOf: string,
): VaultPositionState {
  const warnings: AccountingWarning[] = [];

  // Filter to only transactions at-or-before asOf, then sort
  const relevant = sortTransactions(
    transactions.filter((tx) => tx.occurred_at <= asOf),
  );

  let sharesHeld = D(0);
  let totalDeposited = D(0);
  let totalWithdrawn = D(0);

  for (const tx of relevant) {
    if (tx.kind === 'deposit') {
      const { delta } = resolveSharesDelta(tx);
      if (delta !== null) {
        sharesHeld = sharesHeld.add(delta);
      }
      totalDeposited = totalDeposited.add(D(tx.usdc_amount));
    } else if (tx.kind === 'withdrawal') {
      const { delta } = resolveSharesDelta(tx);
      if (delta !== null) {
        // Check if this withdrawal would over-withdraw before burning
        if (delta.gt(sharesHeld)) {
          warnings.push({
            kind: 'over_withdraw',
            sharesAttempted: delta,
            sharesHeld: sharesHeld,
          });
        }
        sharesHeld = sharesHeld.sub(delta);
      }
      totalWithdrawn = totalWithdrawn.add(D(tx.usdc_amount));
    }
    // 'fee' and 'transfer' kinds are not share-based; skip for vault position
  }

  // Check for negative shares (can happen from over-withdraw or bad data)
  if (sharesHeld.lt(D(0))) {
    warnings.push({ kind: 'negative_shares', sharesHeld });
  }

  // Resolve the latest snapshot share price at or before asOf
  const snapshot = latestAtOrBefore(snapshots, asOf);

  if (snapshot === null) {
    warnings.push({ kind: 'missing_snapshot' });
    return {
      sharesHeld,
      totalDeposited,
      totalWithdrawn,
      latestSharePrice: null,
      currentValue: null,
      lifetimePnl: null,
      warnings,
    };
  }

  const latestSharePrice = D(snapshot.share_price);
  const currentValue = sharesHeld.mul(latestSharePrice);
  // lifetimePnl = currentValue + totalWithdrawn - totalDeposited
  const lifetimePnl = currentValue.add(totalWithdrawn).sub(totalDeposited);

  return {
    sharesHeld,
    totalDeposited,
    totalWithdrawn,
    latestSharePrice,
    currentValue,
    lifetimePnl,
    warnings,
  };
}

/**
 * Compute the share price at a specific transaction, using the transaction's
 * own share_price field if set, otherwise falling back to the latest snapshot
 * at-or-before the transaction's occurred_at.
 *
 * Used externally when classifying individual withdrawals.
 */
export function sharePriceAtTransaction(
  tx: LedgerTransaction,
  snapshots: VaultPriceSnapshot[],
): ReturnType<typeof D> | null {
  if (tx.share_price !== null && tx.share_price !== '') {
    return D(tx.share_price);
  }
  const snapshot = latestAtOrBefore(snapshots, tx.occurred_at);
  if (snapshot !== null) {
    return D(snapshot.share_price);
  }
  return null;
}

/**
 * Compute the vault position state just before a given transaction is applied.
 * Useful for withdrawal classification at event time.
 */
export function computeVaultPositionBefore(
  transactions: LedgerTransaction[],
  snapshots: VaultPriceSnapshot[],
  beforeTxId: string,
): VaultPositionState | null {
  const sorted = sortTransactions(transactions);
  const idx = sorted.findIndex((tx) => tx.id === beforeTxId);
  if (idx === -1) return null;

  const txBefore = sorted[idx];
  // Use the occurred_at of the target tx as asOf, but exclude the tx itself
  const priorTxns = sorted.slice(0, idx);
  return computeVaultPosition(priorTxns, snapshots, txBefore.occurred_at);
}

export { max };
