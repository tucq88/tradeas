import { describe, it, expect } from 'vitest';
import type {
  LedgerAccount, LedgerTransaction, VaultPriceSnapshot, AgentEquitySnapshot,
} from '@/data/ledger/types';

describe('ledger types — numeric-as-string', () => {
  it('LedgerTransaction numeric fields are typed as string', () => {
    const tx: LedgerTransaction = {
      id: 'id',
      created_at: '2026-01-01T00:00:00Z',
      occurred_at: '2026-01-01T00:00:00Z',
      account_id: 'acc',
      product_id: 'prod',
      kind: 'deposit',
      usdc_amount: '1000.00',
      share_price: '1.05',
      shares_delta: '952.380952',
      import_batch_id: null,
      archived_at: null,
    };
    expect(typeof tx.usdc_amount).toBe('string');
    expect(typeof tx.share_price).toBe('string');
  });

  it('VaultPriceSnapshot share_price is typed as string', () => {
    const snap: VaultPriceSnapshot = {
      id: 'id',
      created_at: '2026-01-01T00:00:00Z',
      product_id: 'prod',
      snapshot_at: '2026-01-01T00:00:00Z',
      share_price: '1.050000000000',
      archived_at: null,
    };
    expect(typeof snap.share_price).toBe('string');
  });

  it('AgentEquitySnapshot equity_usdc is typed as string', () => {
    const snap: AgentEquitySnapshot = {
      id: 'id',
      created_at: '2026-01-01T00:00:00Z',
      account_id: 'acc',
      product_id: 'prod',
      snapshot_at: '2026-01-01T00:00:00Z',
      equity_usdc: '5000.123456789012',
      archived_at: null,
    };
    expect(typeof snap.equity_usdc).toBe('string');
  });

  it('LedgerAccount has no numeric fields', () => {
    const acc: LedgerAccount = {
      id: 'id',
      created_at: '2026-01-01T00:00:00Z',
      name: 'Quant Terminal',
      venue: 'quant-terminal',
    };
    expect(acc.name).toBe('Quant Terminal');
  });
});
