import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { SpotLot } from '../types';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/lib/supabase';
import { spotLots } from '../spotLots';

function makeChain(data: unknown, error: unknown = null) {
  const resolved = { data, error };
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(resolved),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
  };
  return chain;
}

const mockFrom = vi.mocked(supabase.from);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('spotLots.list', () => {
  it('returns rows from supabase', async () => {
    const rows: SpotLot[] = [
      { id: '1', created_at: '2024-01-01T00:00:00Z', asset: 'BTC', amount: 0.1,
        entry_price: 50000, cost_usd: 5000, date: '2024-01-01', status: 'wip',
        exit_price: null, exit_date: null },
    ];
    mockFrom.mockReturnValue(makeChain(rows) as never);
    const result = await spotLots.list();
    expect(mockFrom).toHaveBeenCalledWith('spot_lots');
    expect(result).toEqual(rows);
  });
});

describe('spotLots.create', () => {
  it('inserts and returns new row', async () => {
    const input = { asset: 'ETH', amount: 1, entry_price: 3000, cost_usd: 3000,
      date: '2024-01-02', status: 'wip' as const, exit_price: null, exit_date: null };
    const created: SpotLot = { id: '2', created_at: '2024-01-02T00:00:00Z', ...input };
    mockFrom.mockReturnValue(makeChain(created) as never);
    const result = await spotLots.create(input);
    expect(mockFrom).toHaveBeenCalledWith('spot_lots');
    expect(result).toEqual(created);
  });
});

describe('spotLots.markDone', () => {
  it('updates row with done status', async () => {
    const updated: SpotLot = { id: '1', created_at: '2024-01-01T00:00:00Z', asset: 'BTC',
      amount: 0.1, entry_price: 50000, cost_usd: 5000, date: '2024-01-01',
      status: 'done', exit_price: 55000, exit_date: '2024-06-01' };
    const chain = makeChain(updated);
    mockFrom.mockReturnValue(chain as never);
    const result = await spotLots.markDone('1', 55000, '2024-06-01');
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'done', exit_price: 55000, exit_date: '2024-06-01' })
    );
    expect(result).toEqual(updated);
  });

  it('throws before supabase call when exitPrice missing', async () => {
    await expect(spotLots.markDone('1', 0, '2024-06-01')).rejects.toThrow(
      'exitPrice and exitDate required'
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('throws before supabase call when exitDate missing', async () => {
    await expect(spotLots.markDone('1', 55000, '')).rejects.toThrow(
      'exitPrice and exitDate required'
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
