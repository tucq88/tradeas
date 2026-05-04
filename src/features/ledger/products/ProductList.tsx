import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerProducts } from '@/data/ledger/products';
import type { LedgerProduct } from '@/data/ledger/types';
import { useLedgerProducts } from '@/data/hooks/useLedgerProducts';

export function ProductList() {
  const { data: products = [], isLoading } = useLedgerProducts();
  const qc = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: (id: string) => ledgerProducts.remove(id),
    onSuccess: (_, id) => {
      qc.setQueryData<LedgerProduct[]>(['ledger', 'products'], (old) =>
        (old ?? []).filter((p) => p.id !== id),
      );
    },
  });

  if (isLoading) return <p className="text-fg-3 text-sm">loading…</p>;
  if (!products.length) return <p className="text-fg-3 text-sm">no products yet</p>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-fg-3 text-left border-b border-border-1">
          <th className="pb-1 font-medium">name</th>
          <th className="pb-1 font-medium">type</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id} className="border-b border-border-1 last:border-0">
            <td className="py-1 pr-4 text-fg-1 font-mono">{p.name}</td>
            <td className="py-1 pr-4 text-fg-2">{p.product_type}</td>
            <td className="py-1 text-right">
              <button
                type="button"
                onClick={() => removeMutation.mutate(p.id)}
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
