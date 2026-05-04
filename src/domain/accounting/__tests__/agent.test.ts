import { describe, it, expect } from 'vitest';
import { computeAgentPosition } from '../agent';
import type { LedgerTransaction, AgentEquitySnapshot } from '@/data/ledger/types';
import { D } from '@/lib/decimal';

function makeTx(
  overrides: Partial<LedgerTransaction> & Pick<LedgerTransaction, 'kind' | 'usdc_amount' | 'occurred_at'>,
): LedgerTransaction {
  return {
    id: 'tx-' + Math.random().toString(36).slice(2),
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
  overrides: Partial<AgentEquitySnapshot> & Pick<AgentEquitySnapshot, 'equity_usdc' | 'snapshot_at'>,
): AgentEquitySnapshot {
  return {
    id: 'snap-' + Math.random().toString(36).slice(2),
    created_at: '2024-01-01T00:00:00Z',
    account_id: 'acc-1',
    product_id: 'prod-1',
    archived_at: null,
    ...overrides,
  };
}

const DEPOSIT_TX = makeTx({ kind: 'deposit', usdc_amount: '1000', occurred_at: '2024-01-15T00:00:00Z' });
const SNAP_1020 = makeSnapshot({ equity_usdc: '1020', snapshot_at: '2024-02-01T00:00:00Z' });
const SNAP_1051 = makeSnapshot({ equity_usdc: '1051', snapshot_at: '2024-03-01T00:00:00Z' });
const AS_OF = '2024-03-01T23:59:59Z';

describe('computeAgentPosition', () => {
  it('returns correct totals with deposit 1000 and two equity snapshots', () => {
    const result = computeAgentPosition([DEPOSIT_TX], [SNAP_1020, SNAP_1051], AS_OF);
    expect(result.totalDeposited.eq(D('1000'))).toBe(true);
    expect(result.totalWithdrawn.eq(D('0'))).toBe(true);
    expect(result.currentValue!.eq(D('1051'))).toBe(true);
    expect(result.latestEquityAt).toBe('2024-03-01T00:00:00Z');
    expect(result.warnings).toHaveLength(0);
  });

  it('lifetimePnl = currentValue + totalWithdrawn - totalDeposited', () => {
    const result = computeAgentPosition([DEPOSIT_TX], [SNAP_1020, SNAP_1051], AS_OF);
    expect(result.lifetimePnl!.eq(D('51'))).toBe(true);
  });

  it('excludes future snapshots', () => {
    const futureSnap = makeSnapshot({ equity_usdc: '2000', snapshot_at: '2024-04-01T00:00:00Z' });
    const result = computeAgentPosition([DEPOSIT_TX], [SNAP_1020, SNAP_1051, futureSnap], AS_OF);
    expect(result.currentValue!.eq(D('1051'))).toBe(true);
  });

  it('missing snapshot → currentValue=null, lifetimePnl=null, warning missing_snapshot', () => {
    const result = computeAgentPosition([DEPOSIT_TX], [], AS_OF);
    expect(result.currentValue).toBeNull();
    expect(result.lifetimePnl).toBeNull();
    expect(result.latestEquityAt).toBeNull();
    expect(result.warnings[0].kind).toBe('missing_snapshot');
  });

  it('stale snapshot → stale_snapshot warning, currentValue still returned', () => {
    const oldSnap = makeSnapshot({ equity_usdc: '1020', snapshot_at: '2024-01-01T00:00:00Z' });
    const asOf = '2024-01-05T00:00:00Z';
    const result = computeAgentPosition([DEPOSIT_TX], [oldSnap], asOf, { staleAfterDays: 3 });
    expect(result.currentValue!.eq(D('1020'))).toBe(true);
    expect(result.warnings[0].kind).toBe('stale_snapshot');
  });

  it('recent snapshot → no stale warning', () => {
    const recentSnap = makeSnapshot({ equity_usdc: '1020', snapshot_at: '2024-01-03T00:00:00Z' });
    const asOf = '2024-01-05T00:00:00Z';
    const result = computeAgentPosition([DEPOSIT_TX], [recentSnap], asOf);
    expect(result.warnings).toHaveLength(0);
  });

  it('withdrawals included in totalWithdrawn and lifetimePnl', () => {
    const withdrawal = makeTx({ kind: 'withdrawal', usdc_amount: '100', occurred_at: '2024-02-10T00:00:00Z' });
    const result = computeAgentPosition([DEPOSIT_TX, withdrawal], [SNAP_1020, SNAP_1051], AS_OF);
    expect(result.totalWithdrawn.eq(D('100'))).toBe(true);
    expect(result.lifetimePnl!.eq(D('151'))).toBe(true);
  });

  it('ignores future transactions', () => {
    const futureDeposit = makeTx({ kind: 'deposit', usdc_amount: '5000', occurred_at: '2024-12-01T00:00:00Z' });
    const result = computeAgentPosition([DEPOSIT_TX, futureDeposit], [SNAP_1020, SNAP_1051], AS_OF);
    expect(result.totalDeposited.eq(D('1000'))).toBe(true);
  });

  it('ignores share_price and shares_delta on transactions', () => {
    const txWithShares = makeTx({
      kind: 'deposit', usdc_amount: '1000', occurred_at: '2024-01-15T00:00:00Z',
      share_price: '1.5', shares_delta: '666.67',
    });
    const r1 = computeAgentPosition([txWithShares], [SNAP_1051], AS_OF);
    const r2 = computeAgentPosition([DEPOSIT_TX], [SNAP_1051], AS_OF);
    expect(r1.totalDeposited.eq(r2.totalDeposited)).toBe(true);
    expect(r1.lifetimePnl!.eq(r2.lifetimePnl!)).toBe(true);
  });

  it('deterministic sort by occurred_at then id', () => {
    const txA = makeTx({ id: 'zzz', kind: 'deposit', usdc_amount: '300', occurred_at: '2024-01-15T00:00:00Z' });
    const txB = makeTx({ id: 'aaa', kind: 'deposit', usdc_amount: '700', occurred_at: '2024-01-15T00:00:00Z' });
    const result = computeAgentPosition([txA, txB], [SNAP_1051], AS_OF);
    expect(result.totalDeposited.eq(D('1000'))).toBe(true);
  });

  it('empty transactions returns zero deposits/withdrawals', () => {
    const result = computeAgentPosition([], [SNAP_1051], AS_OF);
    expect(result.totalDeposited.eq(D('0'))).toBe(true);
    expect(result.totalWithdrawn.eq(D('0'))).toBe(true);
    expect(result.lifetimePnl!.eq(D('1051'))).toBe(true);
  });

  it('respects custom staleAfterDays', () => {
    const snap = makeSnapshot({ equity_usdc: '1051', snapshot_at: '2024-01-01T00:00:00Z' });
    const asOf = '2024-01-07T00:00:00Z';
    const resultDefault = computeAgentPosition([], [snap], asOf);
    expect(resultDefault.warnings[0].kind).toBe('stale_snapshot');
    const resultCustom = computeAgentPosition([], [snap], asOf, { staleAfterDays: 7 });
    expect(resultCustom.warnings).toHaveLength(0);
  });
});
