import { supabase } from '@/lib/supabase';
import type { PerpPosition, PerpPositionInput, PerpPositionPatch } from './types';

// Note: Supabase JS returns numeric columns as strings. Cast at call sites if needed.
export const perpPositions = {
  async list(): Promise<PerpPosition[]> {
    const { data, error } = await supabase
      .from('perp_positions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PerpPosition[];
  },

  async create(input: PerpPositionInput): Promise<PerpPosition> {
    const { data, error } = await supabase
      .from('perp_positions')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data as PerpPosition;
  },

  async update(id: string, patch: PerpPositionPatch): Promise<PerpPosition> {
    const { data, error } = await supabase
      .from('perp_positions')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as PerpPosition;
  },

  async close(id: string, exitPrice: number, closedAt: string): Promise<PerpPosition> {
    if (!exitPrice || !closedAt) throw new Error('exitPrice and closedAt required');
    const { data, error } = await supabase
      .from('perp_positions')
      .update({ status: 'closed' as const, exit_price: exitPrice, closed_at: closedAt })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as PerpPosition;
  },
};
