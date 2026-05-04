import { describe, it, expect } from 'vitest';
import { vaultSnapshotSchema, agentSnapshotSchema } from '@/domain/validation/ledger';

describe('vaultSnapshotSchema', () => {
  it('accepts valid vault snapshot', () => {
    const result = vaultSnapshotSchema.safeParse({
      product_id: 'prod-1',
      snapshot_at: '2026-05-04',
      share_price: '1.46',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing product_id', () => {
    const result = vaultSnapshotSchema.safeParse({
      product_id: '',
      snapshot_at: '2026-05-04',
      share_price: '1.46',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date', () => {
    const result = vaultSnapshotSchema.safeParse({
      product_id: 'prod-1',
      snapshot_at: '2026-5-4',
      share_price: '1.46',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero share price', () => {
    const result = vaultSnapshotSchema.safeParse({
      product_id: 'prod-1',
      snapshot_at: '2026-05-04',
      share_price: '0',
    });
    expect(result.success).toBe(false);
  });
});

describe('agentSnapshotSchema', () => {
  it('accepts valid agent snapshot', () => {
    const result = agentSnapshotSchema.safeParse({
      product_id: 'prod-2',
      account_id: 'acc-1',
      snapshot_at: '2026-05-04',
      equity_usdc: '1051',
    });
    expect(result.success).toBe(true);
  });

  it('accepts zero equity', () => {
    const result = agentSnapshotSchema.safeParse({
      product_id: 'prod-2',
      account_id: 'acc-1',
      snapshot_at: '2026-05-04',
      equity_usdc: '0',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative equity', () => {
    const result = agentSnapshotSchema.safeParse({
      product_id: 'prod-2',
      account_id: 'acc-1',
      snapshot_at: '2026-05-04',
      equity_usdc: '-100',
    });
    expect(result.success).toBe(false);
  });
});
