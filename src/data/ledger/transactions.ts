import { supabase } from '@/lib/supabase';
import type { LedgerTransaction, LedgerTransactionInput, LedgerTransactionPatch } from './types';

export const ledgerTransactions = {
  async list(): Promise<LedgerTransaction[]> {
    const { data, error } = await supabase
      .from('ledger_transactions')
      .select('*')
      .is('archived_at', null)
      .order('occurred_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LedgerTransaction[];
  },

  async listByProduct(productId: string): Promise<LedgerTransaction[]> {
    const { data, error } = await supabase
      .from('ledger_transactions')
      .select('*')
      .eq('product_id', productId)
      .is('archived_at', null)
      .order('occurred_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LedgerTransaction[];
  },

  async listByAccount(accountId: string): Promise<LedgerTransaction[]> {
    const { data, error } = await supabase
      .from('ledger_transactions')
      .select('*')
      .eq('account_id', accountId)
      .is('archived_at', null)
      .order('occurred_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LedgerTransaction[];
  },

  async create(input: LedgerTransactionInput): Promise<LedgerTransaction> {
    const { data, error } = await supabase
      .from('ledger_transactions')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data as LedgerTransaction;
  },

  async update(id: string, patch: LedgerTransactionPatch): Promise<LedgerTransaction> {
    const { data, error } = await supabase
      .from('ledger_transactions')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as LedgerTransaction;
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ledger_transactions')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  remove: async function (id: string): Promise<void> {
    return this.softDelete(id);
  },
};
