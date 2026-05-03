import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { spotLots } from '@/data/spotLots';
import type { SpotLot, SpotLotInput } from '@/data/types';
import type { CoinListEntry } from '@/data/coingecko/coinList';
import { useCoinList } from '@/data/hooks/useCoinList';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AssetPicker } from '@/ui/AssetPicker';
import { numStr } from '@/lib/format';

function maskDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

type FormState = {
  date: string;
  selectedEntry: CoinListEntry | null;
  entry_price: string;
  amount: string;
  cost_usd: string;
  lastEdited: 'amount' | 'cost' | null;
};

const EMPTY: FormState = {
  date: '',
  selectedEntry: null,
  entry_price: '',
  amount: '',
  cost_usd: '',
  lastEdited: null,
};

type Props = { heldIds: string[] };

export function LotForm({ heldIds }: Props) {
  const qc = useQueryClient();
  const { data: coinList } = useCoinList();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [pickerKey, setPickerKey] = useState(0);

  const handleAssetChange = useCallback((entry: CoinListEntry | null) => {
    setForm((f) => ({ ...f, selectedEntry: entry }));
  }, []);

  const handleEntryPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ep = e.target.value;
    const epNum = parseFloat(ep);
    setForm((f) => {
      if (!isNaN(epNum) && epNum > 0) {
        if (f.lastEdited === 'amount' && f.amount !== '')
          return { ...f, entry_price: ep, cost_usd: numStr(parseFloat(f.amount) * epNum, 2) };
        if (f.lastEdited === 'cost' && f.cost_usd !== '')
          return { ...f, entry_price: ep, amount: numStr(parseFloat(f.cost_usd) / epNum, 6) };
      }
      return { ...f, entry_price: ep };
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    setForm((f) => {
      const ep = parseFloat(f.entry_price);
      if (!isNaN(ep) && ep > 0 && amount !== '')
        return { ...f, amount, cost_usd: numStr(parseFloat(amount) * ep, 2), lastEdited: 'amount' };
      return { ...f, amount, lastEdited: 'amount' };
    });
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cost = e.target.value;
    setForm((f) => {
      const ep = parseFloat(f.entry_price);
      if (!isNaN(ep) && ep > 0 && cost !== '')
        return { ...f, cost_usd: cost, amount: numStr(parseFloat(cost) / ep, 6), lastEdited: 'cost' };
      return { ...f, cost_usd: cost, lastEdited: 'cost' };
    });
  };

  const mutation = useMutation({
    mutationFn: (input: SpotLotInput) => spotLots.create(input),
    onSuccess: (newLot) => {
      qc.setQueryData<SpotLot[]>(['spot-lots'], (old) => [newLot, ...(old ?? [])]);
      void qc.invalidateQueries({ queryKey: ['spot-lots'] });
      setForm(EMPTY);
      setPickerKey((k) => k + 1);
    },
  });

  const dateInvalid = form.date !== '' && !isValidISODate(form.date);
  const submitDisabled =
    mutation.isPending ||
    !form.selectedEntry ||
    !isValidISODate(form.date) ||
    isNaN(parseFloat(form.amount)) ||
    isNaN(parseFloat(form.entry_price)) ||
    isNaN(parseFloat(form.cost_usd));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled || !form.selectedEntry) return;
    const amount = parseFloat(form.amount);
    const entry_price = parseFloat(form.entry_price);
    const cost_usd = parseFloat(form.cost_usd);
    mutation.mutate({
      date: form.date,
      asset: form.selectedEntry.symbol.toUpperCase(),
      coingecko_id: form.selectedEntry.id,
      amount,
      entry_price,
      cost_usd,
      status: 'wip',
      exit_price: null,
      exit_date: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        <Input
          type="text"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: maskDate(e.target.value) }))}
          placeholder="YYYY-MM-DD"
          maxLength={10}
        />
        <AssetPicker
          key={pickerKey}
          coinList={coinList}
          heldIds={heldIds}
          value={form.selectedEntry}
          onChange={handleAssetChange}
          placeholder="BTC"
        />
        <Input
          type="number"
          placeholder="entry price"
          value={form.entry_price}
          onChange={handleEntryPriceChange}
          step="any"
          min="0"
        />
        <Input
          type="number"
          placeholder="amount"
          value={form.amount}
          onChange={handleAmountChange}
          step="any"
          min="0"
        />
        <Input
          type="number"
          placeholder="cost USD"
          value={form.cost_usd}
          onChange={handleCostChange}
          step="any"
          min="0"
        />
      </div>
      {dateInvalid && (
        <p className="text-loss text-[11px]">date must be a valid YYYY-MM-DD</p>
      )}
      {mutation.isError && (
        <p className="text-loss text-[11px]">error saving lot — try again</p>
      )}
      <Button type="submit" variant="primary" disabled={submitDisabled}>
        {mutation.isPending ? 'adding…' : 'add lot'}
      </Button>
    </form>
  );
}
