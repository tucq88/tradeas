import { supabase } from '@/lib/supabase';
import type { LedgerProduct, LedgerProductInput, LedgerProductPatch } from './types';

export const ledgerProducts = {
  async list(): Promise<LedgerProduct[]> {
    const { data, error } = await supabase
      .from('ledger_products')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as LedgerProduct[];
  },

  async create(input: LedgerProductInput): Promise<LedgerProduct> {
    const { data, error } = await supabase
      .from('ledger_products')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data as LedgerProduct;
  },

  async update(id: string, patch: LedgerProductPatch): Promise<LedgerProduct> {
    const { data, error } = await supabase
      .from('ledger_products')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as LedgerProduct;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('ledger_products').delete().eq('id', id);
    if (error) throw error;
  },
};
