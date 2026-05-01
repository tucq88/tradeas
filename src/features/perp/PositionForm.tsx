import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { perpPositions } from '@/data/perpPositions';
import type { PerpPosition } from '@/data/types';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

type Props = {
  initial?: PerpPosition;
  onDone: () => void;
};

type FormState = {
  symbol: string;
  direction: 'long' | 'short';
  entry_price: string;
  leverage: string;
  size_usdt: string;
  mmr_override: string;
};

function initState(row?: PerpPosition): FormState {
  if (!row) {
    return { symbol: '', direction: 'long', entry_price: '', leverage: '', size_usdt: '', mmr_override: '' };
  }
  return {
    symbol: row.symbol,
    direction: row.direction,
    entry_price: String(row.entry_price),
    leverage: String(row.leverage),
    size_usdt: String(row.size_usdt),
    mmr_override: row.mmr_override != null ? String(row.mmr_override * 100) : '',
  };
}

export function PositionForm({ initial, onDone }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() => initState(initial));

  const isEdit = !!initial;

  const mutation = useMutation({
    mutationFn: async () => {
      const entry = Number(form.entry_price);
      const lev = Number(form.leverage);
      const size = Number(form.size_usdt);
      const mmrRaw = form.mmr_override.trim();
      const mmr = mmrRaw !== '' ? Number(mmrRaw) / 100 : null;

      if (!form.symbol || !entry || !lev || !size) throw new Error('All fields required');

      const payload = {
        symbol: form.symbol.toUpperCase(),
        direction: form.direction,
        entry_price: entry,
        leverage: lev,
        size_usdt: size,
        mmr_override: mmr,
      };

      if (isEdit) {
        return perpPositions.update(initial.id, payload);
      }
      return perpPositions.create({ ...payload, status: 'open', closed_at: null, exit_price: null });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perp-positions'] });
      onDone();
    },
  });

  function set(key: keyof FormState, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const isValid =
    form.symbol.trim() !== '' &&
    Number(form.entry_price) > 0 &&
    Number(form.leverage) > 0 &&
    Number(form.size_usdt) > 0;

  return (
    <form
      className="flex flex-col gap-2 bg-bg-2 border border-border-1 rounded-sm p-3"
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="label-caps">Symbol</span>
          <Input
            placeholder="BTCUSDT"
            value={form.symbol}
            onChange={(e) => set('symbol', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="label-caps">Direction</span>
          <select
            className="bg-bg-inset border border-border-1 rounded-sm px-[10px] h-[34px] text-fg-1 font-mono text-sm focus:outline-none focus:border-border-emph"
            value={form.direction}
            onChange={(e) => set('direction', e.target.value as 'long' | 'short')}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="label-caps">Entry Price</span>
          <Input
            type="number"
            placeholder="0.00"
            value={form.entry_price}
            onChange={(e) => set('entry_price', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="label-caps">Leverage</span>
          <Input
            type="number"
            placeholder="10"
            suffix="x"
            value={form.leverage}
            onChange={(e) => set('leverage', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="label-caps">Size</span>
          <Input
            type="number"
            placeholder="100"
            suffix="USDT"
            value={form.size_usdt}
            onChange={(e) => set('size_usdt', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="label-caps">MMR Override %</span>
          <Input
            type="number"
            placeholder="0.5 (optional)"
            value={form.mmr_override}
            onChange={(e) => set('mmr_override', e.target.value)}
          />
        </div>
      </div>
      {mutation.isError && (
        <p className="text-loss text-[12px]">{String((mutation.error as Error).message)}</p>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={!isValid || mutation.isPending}>
          {isEdit ? 'Save' : 'Add Position'}
        </Button>
      </div>
    </form>
  );
}
