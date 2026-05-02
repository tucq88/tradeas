import { supabase } from '@/lib/supabase';
import type { SpotLot, SpotLotInput, SpotLotPatch } from './types';

// Note: Supabase JS returns numeric columns as strings. Cast at call sites if needed.
export const spotLots = {
  async list(): Promise<SpotLot[]> {
    const { data, error } = await supabase
      .from('spot_lots')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SpotLot[];
  },

  async create(input: SpotLotInput): Promise<SpotLot> {
    const { data, error } = await supabase
      .from('spot_lots')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data as SpotLot;
  },

  async update(id: string, patch: SpotLotPatch): Promise<SpotLot> {
    const { data, error } = await supabase
      .from('spot_lots')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as SpotLot;
  },

  async markDone(id: string, exitPrice: number, exitDate: string): Promise<SpotLot> {
    if (!exitPrice || !exitDate) throw new Error('exitPrice and exitDate required');
    const { data, error } = await supabase
      .from('spot_lots')
      .update({ status: 'done' as const, exit_price: exitPrice, exit_date: exitDate })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as SpotLot;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('spot_lots').delete().eq('id', id);
    if (error) throw error;
  },

  async bulkCreate(inputs: SpotLotInput[]): Promise<SpotLot[]> {
    const { data, error } = await supabase
      .from('spot_lots')
      .insert(inputs)
      .select();
    if (error) throw error;
    return (data ?? []) as SpotLot[];
  },
};
