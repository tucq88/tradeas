import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vaultPriceSnapshots, agentEquitySnapshots } from '@/data/ledger/snapshots';
import type { VaultPriceSnapshot, AgentEquitySnapshot } from '@/data/ledger/types';
import { useLedgerSnapshots } from '@/data/hooks/useLedgerSnapshots';
import { useLedgerProducts } from '@/data/hooks/useLedgerProducts';
import { useLedgerAccounts } from '@/data/hooks/useLedgerAccounts';

export function SnapshotList() {
  const { data: snapshots, isLoading } = useLedgerSnapshots();
  const { data: products = [] } = useLedgerProducts();
  const { data: accounts = [] } = useLedgerAccounts();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'vault' | 'agent'>('vault');

  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  const vaultSnaps = snapshots?.vault ?? [];
  const agentSnaps = snapshots?.agent ?? [];

  const vaultRemove = useMutation({
    mutationFn: (id: string) => vaultPriceSnapshots.softDelete(id),
    onSuccess: (_, id) => {
      qc.setQueryData<{ vault: VaultPriceSnapshot[]; agent: AgentEquitySnapshot[] }>(
        ['ledger', 'snapshots'],
        (old) => old ? { ...old, vault: old.vault.filter((s) => s.id !== id) } : old,
      );
    },
  });

  const agentRemove = useMutation({
    mutationFn: (id: string) => agentEquitySnapshots.softDelete(id),
    onSuccess: (_, id) => {
      qc.setQueryData<{ vault: VaultPriceSnapshot[]; agent: AgentEquitySnapshot[] }>(
        ['ledger', 'snapshots'],
        (old) => old ? { ...old, agent: old.agent.filter((s) => s.id !== id) } : old,
      );
    },
  });

  if (isLoading) return <p className="text-fg-3 text-sm">loading…</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {(['vault', 'agent'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'px-3 py-1 text-sm rounded-sm transition-colors',
              tab === t ? 'bg-bg-3 text-fg-1' : 'text-fg-3 hover:text-fg-1',
            ].join(' ')}
          >
            {t === 'vault' ? 'vault prices' : 'agent equity'}
          </button>
        ))}
      </div>
      {tab === 'vault' ? (
        !vaultSnaps.length ? (
          <p className="text-fg-3 text-sm">no vault snapshots</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-fg-3 text-left border-b border-border-1">
                <th className="pb-1 font-medium">date</th>
                <th className="pb-1 font-medium">product</th>
                <th className="pb-1 font-medium text-right">share price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vaultSnaps.map((s) => (
                <tr key={s.id} className="border-b border-border-1 last:border-0">
                  <td className="py-1 pr-3 font-mono text-fg-2">{s.snapshot_at.slice(0, 10)}</td>
                  <td className="py-1 pr-3 text-fg-1">{productMap[s.product_id] ?? s.product_id.slice(0, 8)}</td>
                  <td className="py-1 pr-3 font-mono text-fg-1 text-right">{s.share_price}</td>
                  <td className="py-1 text-right">
                    <button
                      type="button"
                      onClick={() => vaultRemove.mutate(s.id)}
                      disabled={vaultRemove.isPending}
                      className="text-fg-3 hover:text-loss text-[11px] transition-colors disabled:opacity-40"
                    >
                      del
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        !agentSnaps.length ? (
          <p className="text-fg-3 text-sm">no agent snapshots</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-fg-3 text-left border-b border-border-1">
                <th className="pb-1 font-medium">date</th>
                <th className="pb-1 font-medium">account</th>
                <th className="pb-1 font-medium">product</th>
                <th className="pb-1 font-medium text-right">equity USDC</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {agentSnaps.map((s) => (
                <tr key={s.id} className="border-b border-border-1 last:border-0">
                  <td className="py-1 pr-3 font-mono text-fg-2">{s.snapshot_at.slice(0, 10)}</td>
                  <td className="py-1 pr-3 text-fg-2">{accountMap[s.account_id] ?? s.account_id.slice(0, 8)}</td>
                  <td className="py-1 pr-3 text-fg-1">{productMap[s.product_id] ?? s.product_id.slice(0, 8)}</td>
                  <td className="py-1 pr-3 font-mono text-fg-1 text-right">{s.equity_usdc}</td>
                  <td className="py-1 text-right">
                    <button
                      type="button"
                      onClick={() => agentRemove.mutate(s.id)}
                      disabled={agentRemove.isPending}
                      className="text-fg-3 hover:text-loss text-[11px] transition-colors disabled:opacity-40"
                    >
                      del
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}
