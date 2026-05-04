import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerAccounts } from '@/data/ledger/accounts';
import type { LedgerAccount } from '@/data/ledger/types';
import { useLedgerAccounts } from '@/data/hooks/useLedgerAccounts';

export function AccountList() {
  const { data: accounts = [], isLoading } = useLedgerAccounts();
  const qc = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: (id: string) => ledgerAccounts.remove(id),
    onSuccess: (_, id) => {
      qc.setQueryData<LedgerAccount[]>(['ledger', 'accounts'], (old) =>
        (old ?? []).filter((a) => a.id !== id),
      );
    },
  });

  if (isLoading) return <p className="text-fg-3 text-sm">loading…</p>;
  if (!accounts.length) return <p className="text-fg-3 text-sm">no accounts yet</p>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-fg-3 text-left border-b border-border-1">
          <th className="pb-1 font-medium">name</th>
          <th className="pb-1 font-medium">venue</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {accounts.map((a) => (
          <tr key={a.id} className="border-b border-border-1 last:border-0">
            <td className="py-1 pr-4 text-fg-1 font-mono">{a.name}</td>
            <td className="py-1 pr-4 text-fg-2">{a.venue}</td>
            <td className="py-1 text-right">
              <button
                type="button"
                onClick={() => removeMutation.mutate(a.id)}
                disabled={removeMutation.isPending}
                className="text-fg-3 hover:text-loss text-[11px] transition-colors disabled:opacity-40"
              >
                remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
