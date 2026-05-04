import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerProducts } from '@/data/ledger/products';
import type { LedgerProduct, LedgerProductInput } from '@/data/ledger/types';
import { productSchema } from '@/domain/validation/ledger';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

const EMPTY: { name: string; product_type: 'vault' | 'agent'; share_based: boolean } = {
  name: '',
  product_type: 'vault',
  share_based: true,
};

export function ProductForm() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const parsed = productSchema.safeParse(form);

  const mutation = useMutation({
    mutationFn: (input: LedgerProductInput) => ledgerProducts.create(input),
    onSuccess: (product) => {
      qc.setQueryData<LedgerProduct[]>(['ledger', 'products'], (old) => [
        ...(old ?? []),
        product,
      ]);
      void qc.invalidateQueries({ queryKey: ['ledger', 'products'] });
      setForm(EMPTY);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed.success) return;
    mutation.mutate(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="product name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <label className="flex items-center gap-1 text-sm text-fg-2">
          <span>type</span>
          <select
            value={form.product_type}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                product_type: e.target.value as 'vault' | 'agent',
                share_based: e.target.value === 'vault',
              }))
            }
            className="bg-bg-inset border border-border-1 rounded-sm px-2 h-[34px] text-fg-1 text-sm"
          >
            <option value="vault">vault</option>
            <option value="agent">agent</option>
          </select>
        </label>
        <Button type="submit" variant="primary" disabled={!parsed.success || mutation.isPending}>
          {mutation.isPending ? 'adding…' : 'add product'}
        </Button>
      </div>
      {mutation.isError && (
        <p className="text-loss text-[11px]">error saving — try again</p>
      )}
    </form>
  );
}
