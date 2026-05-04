import { describe, it, expect } from 'vitest';
import { computeVaultPosition } from '../vault';
import type { LedgerTransaction, VaultPriceSnapshot } from '@/data/ledger/types';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeTx(
  overrides: Partial<LedgerTransaction> & Pick<LedgerTransaction, 'kind' | 'usdc_amount' | 'occurred_at'>,
): LedgerTransaction {
  return {
    id: overrides.id ?? 'tx-1',
    created_at: '2024-01-01T00:00:00Z',
    account_id: 'acc-1',
    product_id: 'prod-1',
    share_price: null,
    shares_delta: null,
    import_batch_id: null,
    archived_at: null,
    ...overrides,
  };
}

function makeSnapshot(
  overrides: Partial<VaultPriceSnapshot> & Pick<VaultPriceSnapshot, 'snapshot_at' | 'share_price'>,
): VaultPriceSnapshot {
  return {
    id: overrides.id ?? 'snap-1',
    created_at: '2024-01-01T00:00:00Z',
    product_id: 'prod-1',
    archived_at: null,
    ...overrides,
  };
}

const ASO = '2024-06-01T00:00:00Z';

// ---------------------------------------------------------------------------
// Core fixture from notes.ledger-context.md
// deposit 4000 @ SP 1.00 → 4000 shares
// withdraw 500 @ SP 1.46 → burns 342.465753424657534247 shares
// remaining = 3657.534246575342465753
// current value at SP 1.46 = 5340
// lifetimePnl = 5340 + 500 - 4000 = 1840
// ---------------------------------------------------------------------------

describe('computeVaultPosition — core fixture', () => {
  const deposit = makeTx({
    id: 'tx-deposit',
    kind: 'deposit',
    usdc_amount: '4000',
    share_price: '1.00',
    occurred_at: '2024-01-10T00:00:00Z',
  });

  const withdrawal = makeTx({
    id: 'tx-withdrawal',
    kind: 'withdrawal',
    usdc_amount: '500',
    share_price: '1.46',
    occurred_at: '2024-03-15T00:00:00Z',
  });

  const snapshot = makeSnapshot({
    id: 'snap-latest',
    snapshot_at: '2024-05-01T00:00:00Z',
    share_price: '1.46',
  });

  const result = computeVaultPosition([deposit, withdrawal], [snapshot], ASO);

  it('sharesHeld ≈ 3657.5342 (deposit 4000 shares minus 500/1.46 burned shares)', () => {
    // deposit mints 4000 / 1.00 = 4000 shares
    // withdrawal burns 500 / 1.46 ≈ 342.465753424657534...
    // remaining ≈ 3657.534246575342465...
    // Decimal.js default precision = 20 sig figs; assert to 4 decimal places
    expect(result.sharesHeld.toFixed(4)).toBe('3657.5342');
    // Verify precision is not truncated prematurely — at least 10 decimal places held
    expect(result.sharesHeld.toFixed(10)).toBe('3657.5342465753');
  });

  it('totalDeposited = 4000', () => {
    expect(result.totalDeposited.toFixed(2)).toBe('4000.00');
  });

  it('totalWithdrawn = 500', () => {
    expect(result.totalWithdrawn.toFixed(2)).toBe('500.00');
  });

  it('latestSharePrice = 1.46', () => {
    expect(result.latestSharePrice?.toFixed(2)).toBe('1.46');
  });

  it('currentValue = 5340 (3657.534246575342465753 × 1.46)', () => {
    // 3657.534246575342465753 * 1.46 = 5340.0 (exactly)
    expect(result.currentValue?.toFixed(4)).toBe('5340.0000');
  });

  it('lifetimePnl = 1840 (5340 + 500 - 4000)', () => {
    expect(result.lifetimePnl?.toFixed(4)).toBe('1840.0000');
  });

  it('no warnings', () => {
    expect(result.warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Missing snapshot → currentValue and lifetimePnl are null, missing_snapshot warning
// ---------------------------------------------------------------------------

describe('computeVaultPosition — missing snapshot', () => {
  const deposit = makeTx({
    id: 'tx-d1',
    kind: 'deposit',
    usdc_amount: '1000',
    share_price: '1.00',
    occurred_at: '2024-01-01T00:00:00Z',
  });

  it('returns null currentValue and lifetimePnl when no snapshot exists', () => {
    const result = computeVaultPosition([deposit], [], ASO);
    expect(result.currentValue).toBeNull();
    expect(result.lifetimePnl).toBeNull();
    expect(result.latestSharePrice).toBeNull();
  });

  it('emits missing_snapshot warning', () => {
    const result = computeVaultPosition([deposit], [], ASO);
    expect(result.warnings.some((w) => w.kind === 'missing_snapshot')).toBe(true);
  });

  it('still computes sharesHeld and totals', () => {
    const result = computeVaultPosition([deposit], [], ASO);
    expect(result.sharesHeld.toFixed(2)).toBe('1000.00');
    expect(result.totalDeposited.toFixed(2)).toBe('1000.00');
    expect(result.totalWithdrawn.toFixed(2)).toBe('0.00');
  });
});

// ---------------------------------------------------------------------------
// Snapshot after asOf → not used (treated as missing)
// ---------------------------------------------------------------------------

describe('computeVaultPosition — snapshot is after asOf', () => {
  const deposit = makeTx({
    id: 'tx-d1',
    kind: 'deposit',
    usdc_amount: '2000',
    share_price: '1.00',
    occurred_at: '2024-01-01T00:00:00Z',
  });

  const futureSnapshot = makeSnapshot({
    snapshot_at: '2025-01-01T00:00:00Z',
    share_price: '2.00',
  });

  it('does not use future snapshot', () => {
    const result = computeVaultPosition([deposit], [futureSnapshot], ASO);
    expect(result.currentValue).toBeNull();
    expect(result.warnings.some((w) => w.kind === 'missing_snapshot')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Multiple deposits at different share prices aggregate correctly
// ---------------------------------------------------------------------------

describe('computeVaultPosition — multiple deposits at different share prices', () => {
  const d1 = makeTx({
    id: 'tx-d1',
    kind: 'deposit',
    usdc_amount: '1000',
    share_price: '1.00',
    occurred_at: '2024-01-01T00:00:00Z',
  });
  const d2 = makeTx({
    id: 'tx-d2',
    kind: 'deposit',
    usdc_amount: '1000',
    share_price: '2.00',
    occurred_at: '2024-02-01T00:00:00Z',
  });
  // d1: 1000 / 1.00 = 1000 shares
  // d2: 1000 / 2.00 = 500 shares
  // total = 1500 shares

  const snapshot = makeSnapshot({
    snapshot_at: '2024-05-01T00:00:00Z',
    share_price: '2.50',
  });

  it('aggregates shares from both deposits', () => {
    const result = computeVaultPosition([d1, d2], [snapshot], ASO);
    expect(result.sharesHeld.toFixed(2)).toBe('1500.00');
  });

  it('totalDeposited is sum of both deposits', () => {
    const result = computeVaultPosition([d1, d2], [snapshot], ASO);
    expect(result.totalDeposited.toFixed(2)).toBe('2000.00');
  });

  it('currentValue = 1500 × 2.50 = 3750', () => {
    const result = computeVaultPosition([d1, d2], [snapshot], ASO);
    expect(result.currentValue?.toFixed(2)).toBe('3750.00');
  });

  it('lifetimePnl = 3750 + 0 - 2000 = 1750', () => {
    const result = computeVaultPosition([d1, d2], [snapshot], ASO);
    expect(result.lifetimePnl?.toFixed(2)).toBe('1750.00');
  });

  it('no warnings', () => {
    const result = computeVaultPosition([d1, d2], [snapshot], ASO);
    expect(result.warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Uses stored shares_delta when provided (overrides usdc/share_price division)
// ---------------------------------------------------------------------------

describe('computeVaultPosition — uses shares_delta when present', () => {
  const deposit = makeTx({
    id: 'tx-d1',
    kind: 'deposit',
    usdc_amount: '1000',
    share_price: '1.25',
    shares_delta: '777', // explicitly stored, not computed
    occurred_at: '2024-01-01T00:00:00Z',
  });

  const snapshot = makeSnapshot({
    snapshot_at: '2024-05-01T00:00:00Z',
    share_price: '1.50',
  });

  it('uses stored shares_delta = 777 instead of computing 1000/1.25=800', () => {
    const result = computeVaultPosition([deposit], [snapshot], ASO);
    expect(result.sharesHeld.toFixed(2)).toBe('777.00');
  });
});

// ---------------------------------------------------------------------------
// Over-withdrawal emits warning but still processes the transaction
// ---------------------------------------------------------------------------

describe('computeVaultPosition — over-withdraw warning', () => {
  const deposit = makeTx({
    id: 'tx-d1',
    kind: 'deposit',
    usdc_amount: '100',
    share_price: '1.00',
    occurred_at: '2024-01-01T00:00:00Z',
  });

  const bigWithdrawal = makeTx({
    id: 'tx-w1',
    kind: 'withdrawal',
    usdc_amount: '200', // 200 shares at SP 1.00 but we only have 100
    share_price: '1.00',
    occurred_at: '2024-02-01T00:00:00Z',
  });

  const snapshot = makeSnapshot({
    snapshot_at: '2024-05-01T00:00:00Z',
    share_price: '1.00',
  });

  it('emits over_withdraw warning', () => {
    const result = computeVaultPosition([deposit, bigWithdrawal], [snapshot], ASO);
    expect(result.warnings.some((w) => w.kind === 'over_withdraw')).toBe(true);
  });

  it('emits negative_shares warning when shares go below 0', () => {
    const result = computeVaultPosition([deposit, bigWithdrawal], [snapshot], ASO);
    expect(result.warnings.some((w) => w.kind === 'negative_shares')).toBe(true);
  });

  it('does not clamp — sharesHeld goes negative', () => {
    const result = computeVaultPosition([deposit, bigWithdrawal], [snapshot], ASO);
    expect(result.sharesHeld.lt(0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Transaction ordering — out-of-order input is sorted correctly
// ---------------------------------------------------------------------------

describe('computeVaultPosition — input order independence', () => {
  const d1 = makeTx({
    id: 'tx-d1',
    kind: 'deposit',
    usdc_amount: '1000',
    share_price: '1.00',
    occurred_at: '2024-01-01T00:00:00Z',
  });
  const w1 = makeTx({
    id: 'tx-w1',
    kind: 'withdrawal',
    usdc_amount: '200',
    share_price: '1.00',
    occurred_at: '2024-02-01T00:00:00Z',
  });
  const d2 = makeTx({
    id: 'tx-d2',
    kind: 'deposit',
    usdc_amount: '500',
    share_price: '1.00',
    occurred_at: '2024-03-01T00:00:00Z',
  });

  const snapshot = makeSnapshot({
    snapshot_at: '2024-05-01T00:00:00Z',
    share_price: '1.00',
  });

  // expected: 1000 - 200 + 500 = 1300 shares
  it('produces the same result regardless of input order', () => {
    const ordered = computeVaultPosition([d1, w1, d2], [snapshot], ASO);
    const reversed = computeVaultPosition([d2, w1, d1], [snapshot], ASO);
    const shuffled = computeVaultPosition([w1, d2, d1], [snapshot], ASO);

    expect(ordered.sharesHeld.toFixed(2)).toBe('1300.00');
    expect(reversed.sharesHeld.toFixed(2)).toBe('1300.00');
    expect(shuffled.sharesHeld.toFixed(2)).toBe('1300.00');
  });
});

// ---------------------------------------------------------------------------
// asOf filtering — transactions after asOf are excluded
// ---------------------------------------------------------------------------

describe('computeVaultPosition — asOf filtering', () => {
  const d1 = makeTx({
    id: 'tx-d1',
    kind: 'deposit',
    usdc_amount: '1000',
    share_price: '1.00',
    occurred_at: '2024-01-01T00:00:00Z',
  });
  const d2 = makeTx({
    id: 'tx-d2',
    kind: 'deposit',
    usdc_amount: '500',
    share_price: '1.00',
    occurred_at: '2024-06-15T00:00:00Z', // after ASO
  });

  const snapshot = makeSnapshot({
    snapshot_at: '2024-05-01T00:00:00Z',
    share_price: '1.00',
  });

  it('excludes transaction after asOf', () => {
    const result = computeVaultPosition([d1, d2], [snapshot], ASO);
    expect(result.sharesHeld.toFixed(2)).toBe('1000.00');
    expect(result.totalDeposited.toFixed(2)).toBe('1000.00');
  });
});

// ---------------------------------------------------------------------------
// Empty transactions
// ---------------------------------------------------------------------------

describe('computeVaultPosition — empty transactions', () => {
  const snapshot = makeSnapshot({
    snapshot_at: '2024-05-01T00:00:00Z',
    share_price: '2.00',
  });

  it('returns zero state with snapshot', () => {
    const result = computeVaultPosition([], [snapshot], ASO);
    expect(result.sharesHeld.toFixed(2)).toBe('0.00');
    expect(result.totalDeposited.toFixed(2)).toBe('0.00');
    expect(result.totalWithdrawn.toFixed(2)).toBe('0.00');
    expect(result.currentValue?.toFixed(2)).toBe('0.00');
    expect(result.lifetimePnl?.toFixed(2)).toBe('0.00');
    expect(result.warnings).toHaveLength(0);
  });
});
