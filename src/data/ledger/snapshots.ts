import { supabase } from '@/lib/supabase';
import type {
  VaultPriceSnapshot, VaultPriceSnapshotInput, VaultPriceSnapshotPatch,
  AgentEquitySnapshot, AgentEquitySnapshotInput, AgentEquitySnapshotPatch,
} from './types';

export const vaultPriceSnapshots = {
  async list(): Promise<VaultPriceSnapshot[]> {
    const { data, error } = await supabase
      .from('vault_price_snapshots')
      .select('*')
      .is('archived_at', null)
      .order('snapshot_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as VaultPriceSnapshot[];
  },

  async create(input: VaultPriceSnapshotInput): Promise<VaultPriceSnapshot> {
    const { data, error } = await supabase
      .from('vault_price_snapshots')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data as VaultPriceSnapshot;
  },

  async update(id: string, patch: VaultPriceSnapshotPatch): Promise<VaultPriceSnapshot> {
    const { data, error } = await supabase
      .from('vault_price_snapshots')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as VaultPriceSnapshot;
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vault_price_snapshots')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  remove: async function (id: string): Promise<void> {
    return this.softDelete(id);
  },

  async latestVaultPriceAtOrBefore(
    productId: string,
    asOf: string,
  ): Promise<VaultPriceSnapshot | null> {
    const { data, error } = await supabase
      .from('vault_price_snapshots')
      .select('*')
      .eq('product_id', productId)
      .is('archived_at', null)
      .lte('snapshot_at', asOf)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as VaultPriceSnapshot | null;
  },
};

export const agentEquitySnapshots = {
  async list(): Promise<AgentEquitySnapshot[]> {
    const { data, error } = await supabase
      .from('agent_equity_snapshots')
      .select('*')
      .is('archived_at', null)
      .order('snapshot_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AgentEquitySnapshot[];
  },

  async create(input: AgentEquitySnapshotInput): Promise<AgentEquitySnapshot> {
    const { data, error } = await supabase
      .from('agent_equity_snapshots')
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data as AgentEquitySnapshot;
  },

  async update(id: string, patch: AgentEquitySnapshotPatch): Promise<AgentEquitySnapshot> {
    const { data, error } = await supabase
      .from('agent_equity_snapshots')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as AgentEquitySnapshot;
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agent_equity_snapshots')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  remove: async function (id: string): Promise<void> {
    return this.softDelete(id);
  },

  async latestAgentEquityAtOrBefore(
    accountId: string,
    productId: string,
    asOf: string,
  ): Promise<AgentEquitySnapshot | null> {
    const { data, error } = await supabase
      .from('agent_equity_snapshots')
      .select('*')
      .eq('account_id', accountId)
      .eq('product_id', productId)
      .is('archived_at', null)
      .lte('snapshot_at', asOf)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as AgentEquitySnapshot | null;
  },
};
