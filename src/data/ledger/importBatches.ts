import { supabase } from '@/lib/supabase';
import type { LedgerImportBatch, LedgerImportBatchInput, LedgerImportBatchPatch } from './types';

export const ledgerImportBatches = {
  async list(): Promise<LedgerImportBatch[]> {
    const { data, error } = await supabase
      .from('ledger_import_batches')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LedgerImportBatch[];
  },

  async create(input: LedgerImportBatchInput): Promise<LedgerImportBatch> {
    const { data, error } = await supabase
      .from('ledger_import_batches')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data as LedgerImportBatch;
  },

  async update(id: string, patch: LedgerImportBatchPatch): Promise<LedgerImportBatch> {
    const { data, error } = await supabase
      .from('ledger_import_batches')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as LedgerImportBatch;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('ledger_import_batches').delete().eq('id', id);
    if (error) throw error;
  },
};
