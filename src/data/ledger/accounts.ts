import { supabase } from '@/lib/supabase';
import type { LedgerAccount, LedgerAccountInput, LedgerAccountPatch } from './types';

export const ledgerAccounts = {
  async list(): Promise<LedgerAccount[]> {
    const { data, error } = await supabase
      .from('ledger_accounts')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as LedgerAccount[];
  },

  async create(input: LedgerAccountInput): Promise<LedgerAccount> {
    const { data, error } = await supabase
      .from('ledger_accounts')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data as LedgerAccount;
  },

  async update(id: string, patch: LedgerAccountPatch): Promise<LedgerAccount> {
    const { data, error } = await supabase
      .from('ledger_accounts')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as LedgerAccount;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('ledger_accounts').delete().eq('id', id);
    if (error) throw error;
  },
};
