import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { PerpPosition } from '../types';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/lib/supabase';
import { perpPositions } from '../perpPositions';

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

describe('perpPositions.list', () => {
  it('returns rows from supabase', async () => {
    const rows: PerpPosition[] = [
      { id: '1', created_at: '2024-01-01T00:00:00Z', symbol: 'BTCUSDT',
        direction: 'long', entry_price: 50000, leverage: 10, size_usdt: 1000,
        status: 'open', closed_at: null, exit_price: null, mmr_override: null },
    ];
    mockFrom.mockReturnValue(makeChain(rows) as never);
    const result = await perpPositions.list();
    expect(mockFrom).toHaveBeenCalledWith('perp_positions');
    expect(result).toEqual(rows);
  });
});

describe('perpPositions.create', () => {
  it('inserts and returns new row', async () => {
    const input = { symbol: 'ETHUSDT', direction: 'long' as const, entry_price: 3000,
      leverage: 5, size_usdt: 500, status: 'open' as const, closed_at: null, exit_price: null, mmr_override: null };
    const created: PerpPosition = { id: '2', created_at: '2024-01-02T00:00:00Z', ...input };
    mockFrom.mockReturnValue(makeChain(created) as never);
    const result = await perpPositions.create(input);
    expect(mockFrom).toHaveBeenCalledWith('perp_positions');
    expect(result).toEqual(created);
  });
});

describe('perpPositions.close', () => {
  it('updates row with closed status', async () => {
    const closed: PerpPosition = { id: '1', created_at: '2024-01-01T00:00:00Z',
      symbol: 'BTCUSDT', direction: 'long', entry_price: 50000, leverage: 10,
      size_usdt: 1000, status: 'closed', closed_at: '2024-06-01T12:00:00Z', exit_price: 55000, mmr_override: null };
    const chain = makeChain(closed);
    mockFrom.mockReturnValue(chain as never);
    const result = await perpPositions.close('1', 55000, '2024-06-01T12:00:00Z');
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'closed', exit_price: 55000, closed_at: '2024-06-01T12:00:00Z' })
    );
    expect(result).toEqual(closed);
  });

  it('throws before supabase call when exitPrice missing', async () => {
    await expect(perpPositions.close('1', 0, '2024-06-01T12:00:00Z')).rejects.toThrow(
      'exitPrice and closedAt required'
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('throws before supabase call when closedAt missing', async () => {
    await expect(perpPositions.close('1', 55000, '')).rejects.toThrow(
      'exitPrice and closedAt required'
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
