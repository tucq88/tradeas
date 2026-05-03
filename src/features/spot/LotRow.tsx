import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { spotLots } from '@/data/spotLots';
import type { SpotLot, SpotLotPatch } from '@/data/types';
import type { CoinListEntry } from '@/data/coingecko/coinList';
import { useCoinList } from '@/data/hooks/useCoinList';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { AssetPicker } from '@/ui/AssetPicker';
import { fmtUSD, fmtNum, fmtPrice } from '@/lib/format';

type Mode = 'display' | 'edit' | 'done' | 'remove';

type Props = { lot: SpotLot; heldIds: string[] };

export function LotRow({ lot, heldIds }: Props) {
  const qc = useQueryClient();
  const { data: coinList } = useCoinList();
  const [mode, setMode] = useState<Mode>('display');
  const [editForm, setEditForm] = useState({
    date: lot.date,
    asset: lot.asset,
    coingecko_id: lot.coingecko_id,
    amount: String(lot.amount),
    entry_price: String(lot.entry_price),
    cost_usd: String(lot.cost_usd),
  });
  const [doneForm, setDoneForm] = useState({ exit_price: '', exit_date: '' });

  const applyPatch = (cache: SpotLot[] | undefined, updated: SpotLot): SpotLot[] =>
    (cache ?? []).map((l) => (l.id === updated.id ? updated : l));

  const editMutation = useMutation({
    mutationFn: (p: SpotLotPatch) => spotLots.update(lot.id, p),
    onSuccess: (updated) => {
      qc.setQueryData<SpotLot[]>(['spot-lots'], (old) => applyPatch(old, updated));
      void qc.invalidateQueries({ queryKey: ['spot-lots'] });
      setMode('display');
    },
  });

  const doneMutation = useMutation({
    mutationFn: ({ exitPrice, exitDate }: { exitPrice: number; exitDate: string }) =>
      spotLots.markDone(lot.id, exitPrice, exitDate),
    onSuccess: (updated) => {
      qc.setQueryData<SpotLot[]>(['spot-lots'], (old) => applyPatch(old, updated));
      void qc.invalidateQueries({ queryKey: ['spot-lots'] });
      setMode('display');
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => spotLots.remove(lot.id),
    onSuccess: () => {
      qc.setQueryData<SpotLot[]>(['spot-lots'], (old) => (old ?? []).filter((l) => l.id !== lot.id));
      void qc.invalidateQueries({ queryKey: ['spot-lots'] });
    },
  });

  const enterEdit = () => {
    setEditForm({
      date: lot.date,
      asset: lot.asset,
      coingecko_id: lot.coingecko_id,
      amount: String(lot.amount),
      entry_price: String(lot.entry_price),
      cost_usd: String(lot.cost_usd),
    });
    setMode('edit');
  };

  const setE =
    (f: keyof typeof editForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setEditForm((s) => ({ ...s, [f]: e.target.value }));

  const handleAssetChange = (entry: CoinListEntry | null) => {
    if (!entry) {
      setEditForm((s) => ({ ...s, coingecko_id: null }));
      return;
    }
    setEditForm((s) => ({ ...s, asset: entry.symbol.toUpperCase(), coingecko_id: entry.id }));
  };

  const editEntry: CoinListEntry | null =
    editForm.coingecko_id && coinList ? coinList.get(editForm.coingecko_id) ?? null : null;

  const setD =
    (f: keyof typeof doneForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setDoneForm((s) => ({ ...s, [f]: e.target.value }));

  if (mode === 'edit') {
    const handleSave = () => {
      editMutation.mutate({
        date: editForm.date,
        asset: editForm.asset.trim().toUpperCase(),
        coingecko_id: editForm.coingecko_id,
        amount: parseFloat(editForm.amount),
        entry_price: parseFloat(editForm.entry_price),
        cost_usd: parseFloat(editForm.cost_usd),
      });
    };
    return (
      <div className="flex flex-col gap-2 py-2 border-t border-border-1">
        <div className="grid grid-cols-5 gap-2">
          <Input type="date" value={editForm.date} onChange={setE('date')} />
          <AssetPicker
            coinList={coinList}
            heldIds={heldIds}
            value={editEntry}
            onChange={handleAssetChange}
            placeholder={editForm.asset || 'asset'}
          />
          <Input type="number" value={editForm.amount} onChange={setE('amount')} step="any" min="0" />
          <Input type="number" value={editForm.entry_price} onChange={setE('entry_price')} step="any" min="0" />
          <Input type="number" value={editForm.cost_usd} onChange={setE('cost_usd')} step="any" min="0" />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleSave} disabled={editMutation.isPending}>
            {editMutation.isPending ? 'saving…' : 'save'}
          </Button>
          <Button onClick={() => setMode('display')}>cancel</Button>
        </div>
      </div>
    );
  }

  if (mode === 'done') {
    const exitPrice = parseFloat(doneForm.exit_price);
    const canConfirm = !isNaN(exitPrice) && exitPrice > 0 && !!doneForm.exit_date;
    return (
      <div className="flex flex-col gap-2 py-2 border-t border-border-1">
        <p className="text-fg-3 text-[11px]">close {lot.asset} lot — exit price + date</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="exit price"
            value={doneForm.exit_price}
            onChange={setD('exit_price')}
            step="any"
            min="0"
          />
          <Input type="date" value={doneForm.exit_date} onChange={setD('exit_date')} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => doneMutation.mutate({ exitPrice, exitDate: doneForm.exit_date })}
            disabled={!canConfirm || doneMutation.isPending}
          >
            {doneMutation.isPending ? 'closing…' : 'confirm done'}
          </Button>
          <Button onClick={() => setMode('display')}>cancel</Button>
        </div>
      </div>
    );
  }

  if (mode === 'remove') {
    return (
      <div className="flex items-center justify-between py-2 border-t border-border-1 gap-3">
        <p className="text-loss text-[11px]">remove this lot? this cannot be undone.</p>
        <div className="flex gap-1">
          <Button
            variant="primary"
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
          >
            {removeMutation.isPending ? 'removing…' : 'confirm remove'}
          </Button>
          <Button onClick={() => setMode('display')}>cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 border-t border-border-1 gap-3">
      <div className="flex items-center gap-4 text-[12px] font-mono">
        <span className="text-fg-3">{lot.date}</span>
        <span className="text-fg-2">{fmtNum(Number(lot.amount), 6)}</span>
        <span className="text-fg-2">{fmtPrice(Number(lot.entry_price))}</span>
        <span className="text-fg-3">{fmtUSD(Number(lot.cost_usd))}</span>
      </div>
      <div className="flex gap-1">
        <Button onClick={enterEdit}>edit</Button>
        <Button onClick={() => setMode('done')}>mark done</Button>
        <Button onClick={() => setMode('remove')}>remove</Button>
      </div>
    </div>
  );
}
