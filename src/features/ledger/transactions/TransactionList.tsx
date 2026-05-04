import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerTransactions } from '@/data/ledger/transactions';
import type { LedgerTransaction } from '@/data/ledger/types';
import { useLedgerTransactions } from '@/data/hooks/useLedgerTransactions';
import { useLedgerAccounts } from '@/data/hooks/useLedgerAccounts';
import { useLedgerProducts } from '@/data/hooks/useLedgerProducts';

export function TransactionList() {
  const { data: transactions = [], isLoading } = useLedgerTransactions();
  const { data: accounts = [] } = useLedgerAccounts();
  const { data: products = [] } = useLedgerProducts();
  const qc = useQueryClient();

  const [filterAccount, setFilterAccount] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterKind, setFilterKind] = useState('');

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  const filtered = transactions.filter((t) => {
    if (filterAccount && t.account_id !== filterAccount) return false;
    if (filterProduct && t.product_id !== filterProduct) return false;
    if (filterKind && t.kind !== filterKind) return false;
    return true;
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => ledgerTransactions.softDelete(id),
    onSuccess: (_, id) => {
      qc.setQueryData<LedgerTransaction[]>(['ledger', 'transactions'], (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
    },
  });

  if (isLoading) return <p className="text-fg-3 text-sm">loading…</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="bg-bg-inset border border-border-1 rounded-sm px-2 h-8 text-fg-2 text-sm"
        >
          <option value="">all accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="bg-bg-inset border border-border-1 rounded-sm px-2 h-8 text-fg-2 text-sm"
        >
          <option value="">all products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value)}
          className="bg-bg-inset border border-border-1 rounded-sm px-2 h-8 text-fg-2 text-sm"
        >
          <option value="">all kinds</option>
          {['deposit', 'withdrawal', 'fee', 'transfer'].map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>
      {!filtered.length ? (
        <p className="text-fg-3 text-sm">no transactions</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-fg-3 text-left border-b border-border-1">
              <th className="pb-1 font-medium">date</th>
              <th className="pb-1 font-medium">account</th>
              <th className="pb-1 font-medium">product</th>
              <th className="pb-1 font-medium">kind</th>
              <th className="pb-1 font-medium text-right">usdc</th>
              <th className="pb-1 font-medium text-right">SP</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border-1 last:border-0">
                <td className="py-1 pr-3 font-mono text-fg-2">{t.occurred_at.slice(0, 10)}</td>
                <td className="py-1 pr-3 text-fg-2">{accountMap[t.account_id] ?? t.account_id.slice(0, 8)}</td>
                <td className="py-1 pr-3 text-fg-1">{productMap[t.product_id] ?? t.product_id.slice(0, 8)}</td>
                <td className="py-1 pr-3 text-fg-3">{t.kind}</td>
                <td className="py-1 pr-3 font-mono text-fg-1 text-right">{t.usdc_amount}</td>
                <td className="py-1 pr-3 font-mono text-fg-3 text-right">{t.share_price ?? '—'}</td>
                <td className="py-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(t.id)}
                    disabled={removeMutation.isPending}
                    className="text-fg-3 hover:text-loss text-[11px] transition-colors disabled:opacity-40"
                  >
                    del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
