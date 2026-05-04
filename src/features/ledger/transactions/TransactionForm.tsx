import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerTransactions } from '@/data/ledger/transactions';
import type { LedgerTransaction, LedgerTransactionInput, TransactionKind } from '@/data/ledger/types';
import { useLedgerAccounts } from '@/data/hooks/useLedgerAccounts';
import { useLedgerProducts } from '@/data/hooks/useLedgerProducts';
import { useLedgerTransactions } from '@/data/hooks/useLedgerTransactions';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { WithdrawalPreview } from './WithdrawalPreview';
import { numStr } from '@/lib/format';

function maskDate(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const KINDS: TransactionKind[] = ['deposit', 'withdrawal', 'fee', 'transfer'];

type FormState = {
  occurred_at: string;
  account_id: string;
  product_id: string;
  kind: TransactionKind;
  usdc_amount: string;
  share_price: string;
  shares_input: string;
  last_edited: 'usdc' | 'shares';
};

const EMPTY: FormState = {
  occurred_at: '',
  account_id: '',
  product_id: '',
  kind: 'deposit',
  usdc_amount: '',
  share_price: '',
  shares_input: '',
  last_edited: 'usdc',
};

export function TransactionForm() {
  const qc = useQueryClient();
  const { data: accounts = [] } = useLedgerAccounts();
  const { data: products = [] } = useLedgerProducts();
  const { data: transactions = [] } = useLedgerTransactions();
  const [form, setForm] = useState<FormState>(EMPTY);

  const selectedProduct = products.find((p) => p.id === form.product_id) ?? null;
  const isVault = selectedProduct?.product_type === 'vault';
  const isWithdrawal = form.kind === 'withdrawal';
  const showSharePrice = isVault && (form.kind === 'deposit' || isWithdrawal);
  const showSharesInput = isVault && isWithdrawal;

  const isDuplicate =
    form.usdc_amount !== '' &&
    isValidDate(form.occurred_at) &&
    transactions.some(
      (t) =>
        t.account_id === form.account_id &&
        t.product_id === form.product_id &&
        t.kind === form.kind &&
        t.occurred_at.slice(0, 10) === form.occurred_at &&
        t.usdc_amount === form.usdc_amount,
    );

  const isValid =
    isValidDate(form.occurred_at) &&
    form.account_id !== '' &&
    form.product_id !== '' &&
    form.usdc_amount !== '' &&
    !isNaN(parseFloat(form.usdc_amount)) &&
    parseFloat(form.usdc_amount) > 0 &&
    (!showSharePrice ||
      (form.share_price !== '' && !isNaN(parseFloat(form.share_price)) && parseFloat(form.share_price) > 0));

  const mutation = useMutation({
    mutationFn: (input: LedgerTransactionInput) => ledgerTransactions.create(input),
    onSuccess: (tx) => {
      qc.setQueryData<LedgerTransaction[]>(['ledger', 'transactions'], (old) => [tx, ...(old ?? [])]);
      void qc.invalidateQueries({ queryKey: ['ledger', 'transactions'] });
      setForm(EMPTY);
    },
  });

  const handleUsdcChange = (val: string) => {
    setForm((f) => {
      const sp = parseFloat(f.share_price);
      const usdc = parseFloat(val);
      if (!isNaN(sp) && sp > 0 && !isNaN(usdc) && usdc > 0) {
        return { ...f, usdc_amount: val, shares_input: numStr(usdc / sp, 6), last_edited: 'usdc' };
      }
      return { ...f, usdc_amount: val, last_edited: 'usdc' };
    });
  };

  const handleSharesChange = (val: string) => {
    setForm((f) => {
      const sp = parseFloat(f.share_price);
      const shares = parseFloat(val);
      if (!isNaN(sp) && sp > 0 && !isNaN(shares) && shares > 0) {
        return { ...f, shares_input: val, usdc_amount: numStr(shares * sp, 2), last_edited: 'shares' };
      }
      return { ...f, shares_input: val, last_edited: 'shares' };
    });
  };

  const handleSpChange = (val: string) => {
    setForm((f) => {
      const sp = parseFloat(val);
      if (!isNaN(sp) && sp > 0) {
        if (f.last_edited === 'usdc' && f.usdc_amount !== '') {
          const usdc = parseFloat(f.usdc_amount);
          if (!isNaN(usdc) && usdc > 0)
            return { ...f, share_price: val, shares_input: numStr(usdc / sp, 6) };
        }
        if (f.last_edited === 'shares' && f.shares_input !== '') {
          const shares = parseFloat(f.shares_input);
          if (!isNaN(shares) && shares > 0)
            return { ...f, share_price: val, usdc_amount: numStr(shares * sp, 2) };
        }
      }
      return { ...f, share_price: val };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const sp = showSharePrice && form.share_price !== '' ? form.share_price : null;
    const sharesDelta =
      showSharesInput && form.shares_input !== '' ? form.shares_input : null;
    mutation.mutate({
      occurred_at: form.occurred_at + 'T00:00:00Z',
      account_id: form.account_id,
      product_id: form.product_id,
      kind: form.kind,
      usdc_amount: form.usdc_amount,
      share_price: sp,
      shares_delta: sharesDelta,
      import_batch_id: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input
          type="text"
          placeholder="YYYY-MM-DD"
          maxLength={10}
          value={form.occurred_at}
          onChange={(e) => setForm((f) => ({ ...f, occurred_at: maskDate(e.target.value) }))}
        />
        <select
          value={form.account_id}
          onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value, product_id: '' }))}
          className="bg-bg-inset border border-border-1 rounded-sm px-2 h-[34px] text-fg-1 text-sm"
        >
          <option value="">account…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={form.product_id}
          onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
          className="bg-bg-inset border border-border-1 rounded-sm px-2 h-[34px] text-fg-1 text-sm"
        >
          <option value="">product…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={form.kind}
          onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as TransactionKind }))}
          className="bg-bg-inset border border-border-1 rounded-sm px-2 h-[34px] text-fg-1 text-sm"
        >
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Input
          type="number"
          placeholder="USDC amount"
          value={form.usdc_amount}
          onChange={(e) => handleUsdcChange(e.target.value)}
          step="any"
          min="0"
          suffix="USDC"
        />
        {showSharePrice && (
          <Input
            type="number"
            placeholder="share price"
            value={form.share_price}
            onChange={(e) => handleSpChange(e.target.value)}
            step="any"
            min="0"
            suffix="SP"
          />
        )}
        {showSharesInput && (
          <Input
            type="number"
            placeholder="shares"
            value={form.shares_input}
            onChange={(e) => handleSharesChange(e.target.value)}
            step="any"
            min="0"
            suffix="shares"
          />
        )}
        <Button type="submit" variant="primary" disabled={!isValid || mutation.isPending}>
          {mutation.isPending ? 'adding…' : 'add transaction'}
        </Button>
      </div>
      {isDuplicate && (
        <p className="text-[11px] text-yellow-400">possible duplicate — same account/product/kind/date/amount already exists</p>
      )}
      {mutation.isError && (
        <p className="text-loss text-[11px]">error saving — try again</p>
      )}
      {showSharesInput && (
        <WithdrawalPreview
          productId={form.product_id}
          transactions={transactions}
          usdcAmount={form.usdc_amount}
          sharePrice={form.share_price}
        />
      )}
    </form>
  );
}
