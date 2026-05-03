import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { spotLots } from '@/data/spotLots';
import type { SpotLot, SpotLotInput } from '@/data/types';
import type { CoinListEntry } from '@/data/coingecko/coinList';
import { useCoinList } from '@/data/hooks/useCoinList';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { AssetPicker } from '@/ui/AssetPicker';
import { numStr } from '@/lib/format';

type FormState = {
  date: string;
  asset: string;
  coingecko_id: string | null;
  entry_price: string;
  amount: string;
  cost_usd: string;
  lastEdited: 'amount' | 'cost' | null;
};

const EMPTY: FormState = {
  date: '',
  asset: '',
  coingecko_id: null,
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

  const handleAssetSelect = (entry: CoinListEntry) => {
    setForm((f) => ({ ...f, asset: entry.symbol.toUpperCase(), coingecko_id: entry.id }));
  };

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
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    const entry_price = parseFloat(form.entry_price);
    const cost_usd = parseFloat(form.cost_usd);
    if (!form.date || !form.asset.trim() || isNaN(amount) || isNaN(entry_price) || isNaN(cost_usd))
      return;
    mutation.mutate({
      date: form.date,
      asset: form.asset.trim().toUpperCase(),
      coingecko_id: form.coingecko_id,
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
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
        <AssetPicker
          coinList={coinList}
          heldIds={heldIds}
          onSelect={handleAssetSelect}
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
      {mutation.isError && (
        <p className="text-loss text-[11px]">error saving lot — try again</p>
      )}
      <Button type="submit" variant="primary" disabled={mutation.isPending || !form.coingecko_id}>
        {mutation.isPending ? 'adding…' : 'add lot'}
      </Button>
    </form>
  );
}
