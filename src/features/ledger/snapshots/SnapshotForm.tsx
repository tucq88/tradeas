import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vaultPriceSnapshots, agentEquitySnapshots } from '@/data/ledger/snapshots';
import type {
  VaultPriceSnapshot,
  VaultPriceSnapshotInput,
  AgentEquitySnapshot,
  AgentEquitySnapshotInput,
} from '@/data/ledger/types';
import { useLedgerAccounts } from '@/data/hooks/useLedgerAccounts';
import { useLedgerProducts } from '@/data/hooks/useLedgerProducts';
import { vaultSnapshotSchema, agentSnapshotSchema } from '@/domain/validation/ledger';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

function maskDate(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

const EMPTY = {
  type: 'vault' as 'vault' | 'agent',
  product_id: '',
  account_id: '',
  snapshot_at: '',
  share_price: '',
  equity_usdc: '',
};

export function SnapshotForm() {
  const qc = useQueryClient();
  const { data: accounts = [] } = useLedgerAccounts();
  const { data: products = [] } = useLedgerProducts();
  const [form, setForm] = useState(EMPTY);

  const vaultProducts = products.filter((p) => p.product_type === 'vault');
  const agentProducts = products.filter((p) => p.product_type === 'agent');
  const displayProducts = form.type === 'vault' ? vaultProducts : agentProducts;

  const parsedVault = form.type === 'vault'
    ? vaultSnapshotSchema.safeParse({
        product_id: form.product_id,
        snapshot_at: form.snapshot_at,
        share_price: form.share_price,
      })
    : null;

  const parsedAgent = form.type === 'agent'
    ? agentSnapshotSchema.safeParse({
        product_id: form.product_id,
        account_id: form.account_id,
        snapshot_at: form.snapshot_at,
        equity_usdc: form.equity_usdc,
      })
    : null;

  const isValid = form.type === 'vault' ? parsedVault?.success : parsedAgent?.success;

  const vaultMutation = useMutation({
    mutationFn: (input: VaultPriceSnapshotInput) => vaultPriceSnapshots.create(input),
    onSuccess: (snap) => {
      qc.setQueryData<{ vault: VaultPriceSnapshot[]; agent: AgentEquitySnapshot[] }>(
        ['ledger', 'snapshots'],
        (old) => old ? { ...old, vault: [snap, ...old.vault] } : { vault: [snap], agent: [] },
      );
      void qc.invalidateQueries({ queryKey: ['ledger', 'snapshots'] });
      setForm(EMPTY);
    },
  });

  const agentMutation = useMutation({
    mutationFn: (input: AgentEquitySnapshotInput) => agentEquitySnapshots.create(input),
    onSuccess: (snap) => {
      qc.setQueryData<{ vault: VaultPriceSnapshot[]; agent: AgentEquitySnapshot[] }>(
        ['ledger', 'snapshots'],
        (old) => old ? { ...old, agent: [snap, ...old.agent] } : { vault: [], agent: [snap] },
      );
      void qc.invalidateQueries({ queryKey: ['ledger', 'snapshots'] });
      setForm(EMPTY);
    },
  });

  const isPending = vaultMutation.isPending || agentMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    if (form.type === 'vault' && parsedVault?.success) {
      vaultMutation.mutate({
        product_id: parsedVault.data.product_id,
        snapshot_at: parsedVault.data.snapshot_at + 'T00:00:00Z',
        share_price: parsedVault.data.share_price,
      });
    } else if (form.type === 'agent' && parsedAgent?.success) {
      agentMutation.mutate({
        product_id: parsedAgent.data.product_id,
        account_id: parsedAgent.data.account_id,
        snapshot_at: parsedAgent.data.snapshot_at + 'T00:00:00Z',
        equity_usdc: parsedAgent.data.equity_usdc,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <label className="flex items-center gap-1 text-sm text-fg-2">
          <span>type</span>
          <select
            value={form.type}
            onChange={(e) =>
              setForm({
                ...EMPTY,
                type: e.target.value as 'vault' | 'agent',
              })
            }
            className="bg-bg-inset border border-border-1 rounded-sm px-2 h-[34px] text-fg-1 text-sm"
          >
            <option value="vault">vault price</option>
            <option value="agent">agent equity</option>
          </select>
        </label>
        <select
          value={form.product_id}
          onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
          className="bg-bg-inset border border-border-1 rounded-sm px-2 h-[34px] text-fg-1 text-sm"
        >
          <option value="">product…</option>
          {displayProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {form.type === 'agent' && (
          <select
            value={form.account_id}
            onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
            className="bg-bg-inset border border-border-1 rounded-sm px-2 h-[34px] text-fg-1 text-sm"
          >
            <option value="">account…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <Input
          type="text"
          placeholder="YYYY-MM-DD"
          maxLength={10}
          value={form.snapshot_at}
          onChange={(e) => setForm((f) => ({ ...f, snapshot_at: maskDate(e.target.value) }))}
        />
        {form.type === 'vault' ? (
          <Input
            type="number"
            placeholder="share price"
            value={form.share_price}
            onChange={(e) => setForm((f) => ({ ...f, share_price: e.target.value }))}
            step="any"
            min="0"
            suffix="SP"
          />
        ) : (
          <Input
            type="number"
            placeholder="equity USDC"
            value={form.equity_usdc}
            onChange={(e) => setForm((f) => ({ ...f, equity_usdc: e.target.value }))}
            step="any"
            min="0"
            suffix="USDC"
          />
        )}
        <Button type="submit" variant="primary" disabled={!isValid || isPending}>
          {isPending ? 'adding…' : 'add snapshot'}
        </Button>
      </div>
      {(vaultMutation.isError || agentMutation.isError) && (
        <p className="text-loss text-[11px]">error saving — try again</p>
      )}
    </form>
  );
}
