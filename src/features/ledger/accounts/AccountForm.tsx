import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerAccounts } from '@/data/ledger/accounts';
import type { LedgerAccount, LedgerAccountInput } from '@/data/ledger/types';
import { accountSchema } from '@/domain/validation/ledger';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

const EMPTY = { name: '', venue: '' };

export function AccountForm() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const parsed = accountSchema.safeParse(form);

  const mutation = useMutation({
    mutationFn: (input: LedgerAccountInput) => ledgerAccounts.create(input),
    onSuccess: (account) => {
      qc.setQueryData<LedgerAccount[]>(['ledger', 'accounts'], (old) => [
        ...(old ?? []),
        account,
      ]);
      void qc.invalidateQueries({ queryKey: ['ledger', 'accounts'] });
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
      <div className="flex gap-2">
        <Input
          placeholder="account name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          placeholder="venue (e.g. Binance)"
          value={form.venue}
          onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
        />
        <Button type="submit" variant="primary" disabled={!parsed.success || mutation.isPending}>
          {mutation.isPending ? 'adding…' : 'add account'}
        </Button>
      </div>
      {mutation.isError && (
        <p className="text-loss text-[11px]">error saving — try again</p>
      )}
    </form>
  );
}
