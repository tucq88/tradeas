import { describe, it, expect } from 'vitest';
import { calculateWeeklyReview } from '../weeklyReview';
import type { LedgerTransaction, VaultPriceSnapshot, AgentEquitySnapshot } from '@/data/ledger/types';
import { D } from '@/lib/decimal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTx(
  overrides: Partial<LedgerTransaction> & Pick<LedgerTransaction, 'kind' | 'usdc_amount' | 'occurred_at'>,
): LedgerTransaction {
  return {
    id: 'tx-' + Math.random().toString(36).slice(2),
    created_at: '2024-01-01T00:00:00Z',
    account_id: 'acc-1',
    product_id: 'prod-vault',
    share_price: null, shares_delta: null, import_batch_id: null, archived_at: null,
    ...overrides,
  };
}

function makeVaultSnap(
  overrides: Partial<VaultPriceSnapshot> & Pick<VaultPriceSnapshot, 'share_price' | 'snapshot_at'>,
): VaultPriceSnapshot {
  return {
    id: 'snap-' + Math.random().toString(36).slice(2),
    created_at: '2024-01-01T00:00:00Z',
    product_id: 'prod-vault',
    archived_at: null,
    ...overrides,
  };
}

function makeAgentSnap(
  overrides: Partial<AgentEquitySnapshot> & Pick<AgentEquitySnapshot, 'equity_usdc' | 'snapshot_at'>,
): AgentEquitySnapshot {
  return {
    id: 'snap-' + Math.random().toString(36).slice(2),
    created_at: '2024-01-01T00:00:00Z',
    account_id: 'acc-1',
    product_id: 'prod-agent',
    archived_at: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Context fixture:
// Deposit 4000 @ SP 1.00 (2024-01-01) → 4000 shares
// Withdraw 500 @ SP 1.46 (2024-01-10) → burns 342.465... shares
// Week: 2024-01-07 (Sun) → 2024-01-13T23:59:59Z as asOf
//   startValue = 4000 shares × 1.38 = 5520
//   endValue   = 3657.53... shares × 1.46 = ~5340
//   weeklyWithdrawals = 500, weeklyDeposits = 0
//   weeklyPnl = 5340 + 500 - 0 - 5520 = 320
//   lifetimePnl = currentValue + totalWithdrawn - totalDeposited = 5340 + 500 - 4000 = 1840
//   suggestedTpUsdc = max(0, min(320, 1840)) = 320
//   suggestedTpShares = 320 / 1.46 = 219.178082...
// ---------------------------------------------------------------------------

const DEPOSIT_TX = makeTx({
  kind: 'deposit', usdc_amount: '4000',
  occurred_at: '2024-01-01T00:00:00Z',
  share_price: '1.00', shares_delta: '4000',
});

const WITHDRAWAL_TX = makeTx({
  kind: 'withdrawal', usdc_amount: '500',
  occurred_at: '2024-01-10T00:00:00Z',
  share_price: '1.46',
});

const SNAP_START = makeVaultSnap({ share_price: '1.38', snapshot_at: '2024-01-07T00:00:00Z' });
const SNAP_END   = makeVaultSnap({ share_price: '1.46', snapshot_at: '2024-01-12T00:00:00Z' });

const AS_OF = '2024-01-13T23:59:59Z';

describe('calculateWeeklyReview — vault fixture', () => {
  it('computes weeklyPnl = 320 from the spec fixture', () => {
    const [row] = calculateWeeklyReview(
      [{
        accountId: 'acc-1', productId: 'prod-vault', productType: 'vault',
        transactions: [DEPOSIT_TX, WITHDRAWAL_TX],
        snapshots: [SNAP_START, SNAP_END],
      }],
      { asOf: AS_OF, timezone: 'UTC' },
    );

    // endValue ≈ 3657.53... × 1.46 = 5340.00...
    expect(row.endValue).not.toBeNull();
    expect(row.endValue!.toFixed(2)).toBe('5340.00');

    // startValue = 4000 × 1.38 = 5520
    expect(row.startValue).not.toBeNull();
    expect(row.startValue!.toFixed(2)).toBe('5520.00');

    expect(row.weeklyWithdrawals.eq(D('500'))).toBe(true);
    expect(row.weeklyDeposits.eq(D('0'))).toBe(true);

    // weeklyPnl = 5340 + 500 - 0 - 5520 = 320
    expect(row.weeklyPnl).not.toBeNull();
    expect(row.weeklyPnl!.toFixed(2)).toBe('320.00');
  });

  it('suggestedTpUsdc = min(weeklyPnl=320, lifetimePnl=1840) = 320', () => {
    const [row] = calculateWeeklyReview(
      [{
        accountId: 'acc-1', productId: 'prod-vault', productType: 'vault',
        transactions: [DEPOSIT_TX, WITHDRAWAL_TX],
        snapshots: [SNAP_START, SNAP_END],
      }],
      { asOf: AS_OF, timezone: 'UTC' },
    );

    expect(row.suggestedTpUsdc).not.toBeNull();
    expect(row.suggestedTpUsdc!.toFixed(2)).toBe('320.00');
  });

  it('suggestedTpShares = 320 / 1.46 ≈ 219.178', () => {
    const [row] = calculateWeeklyReview(
      [{
        accountId: 'acc-1', productId: 'prod-vault', productType: 'vault',
        transactions: [DEPOSIT_TX, WITHDRAWAL_TX],
        snapshots: [SNAP_START, SNAP_END],
      }],
      { asOf: AS_OF, timezone: 'UTC' },
    );

    expect(row.suggestedTpShares).not.toBeNull();
    // 320 / 1.46 = 219.178082191780821917...
    expect(row.suggestedTpShares!.toFixed(6)).toBe('219.178082');
  });

  it('negative weeklyPnl → suggestedTpUsdc = 0', () => {
    // Use a lower end share price so value drops
    const snapLow = makeVaultSnap({ share_price: '1.30', snapshot_at: '2024-01-12T00:00:00Z' });
    const [row] = calculateWeeklyReview(
      [{
        accountId: 'acc-1', productId: 'prod-vault', productType: 'vault',
        transactions: [DEPOSIT_TX, WITHDRAWAL_TX],
        snapshots: [SNAP_START, snapLow],
      }],
      { asOf: AS_OF, timezone: 'UTC' },
    );

    expect(row.weeklyPnl).not.toBeNull();
    expect(row.weeklyPnl!.lt(D('0'))).toBe(true);
    expect(row.suggestedTpUsdc!.eq(D('0'))).toBe(true);
  });

  it('no snapshots at all → weeklyPnl null, warning missing_snapshot', () => {
    const [row] = calculateWeeklyReview(
      [{
        accountId: 'acc-1', productId: 'prod-vault', productType: 'vault',
        transactions: [DEPOSIT_TX, WITHDRAWAL_TX],
        snapshots: [],
      }],
      { asOf: AS_OF, timezone: 'UTC' },
    );

    expect(row.weeklyPnl).toBeNull();
    expect(row.suggestedTpUsdc).toBeNull();
    expect(row.warnings.some((w) => w.kind === 'missing_snapshot')).toBe(true);
  });

  it('only counts weekly cashflows in [weekStart, weekEnd)', () => {
    const preWeekDeposit = makeTx({
      kind: 'deposit', usdc_amount: '1000',
      occurred_at: '2024-01-02T00:00:00Z', // before week start
    });
    const [row] = calculateWeeklyReview(
      [{
        accountId: 'acc-1', productId: 'prod-vault', productType: 'vault',
        transactions: [DEPOSIT_TX, WITHDRAWAL_TX, preWeekDeposit],
        snapshots: [SNAP_START, SNAP_END],
      }],
      { asOf: AS_OF, timezone: 'UTC' },
    );

    // preWeekDeposit should not appear in weeklyDeposits
    expect(row.weeklyDeposits.eq(D('0'))).toBe(true);
  });
});

describe('calculateWeeklyReview — agent', () => {
  it('computes weeklyPnl for agent (equity-based)', () => {
    const deposit = makeTx({ kind: 'deposit', usdc_amount: '1000', occurred_at: '2024-01-01T00:00:00Z' });
    const snapStart = makeAgentSnap({ equity_usdc: '1020', snapshot_at: '2024-01-07T00:00:00Z' });
    const snapEnd = makeAgentSnap({ equity_usdc: '1051', snapshot_at: '2024-01-12T00:00:00Z' });

    const [row] = calculateWeeklyReview(
      [{
        accountId: 'acc-1', productId: 'prod-agent', productType: 'agent',
        transactions: [deposit],
        equitySnapshots: [snapStart, snapEnd],
      }],
      { asOf: AS_OF, timezone: 'UTC' },
    );

    // weeklyPnl = 1051 + 0 - 0 - 1020 = 31
    expect(row.weeklyPnl).not.toBeNull();
    expect(row.weeklyPnl!.eq(D('31'))).toBe(true);
    expect(row.suggestedTpShares).toBeNull(); // agent has no shares
    expect(row.suggestedTpUsdc!.eq(D('31'))).toBe(true);
  });

  it('missing agent snapshot → weeklyPnl null', () => {
    const deposit = makeTx({ kind: 'deposit', usdc_amount: '1000', occurred_at: '2024-01-01T00:00:00Z' });
    const [row] = calculateWeeklyReview(
      [{
        accountId: 'acc-1', productId: 'prod-agent', productType: 'agent',
        transactions: [deposit],
        equitySnapshots: [],
      }],
      { asOf: AS_OF, timezone: 'UTC' },
    );

    expect(row.weeklyPnl).toBeNull();
    expect(row.warnings.some((w) => w.kind === 'missing_snapshot')).toBe(true);
  });
});
