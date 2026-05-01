import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { perpPositions } from '@/data/perpPositions';
import type { PerpPosition } from '@/data/types';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

type Props = {
  position: PerpPosition;
  onDone: () => void;
};

export function CloseDialog({ position, onDone }: Props) {
  const qc = useQueryClient();
  const [exitPrice, setExitPrice] = useState('');

  const parsed = Number(exitPrice);
  const isValid = exitPrice.trim() !== '' && parsed > 0 && Number.isFinite(parsed);

  const mutation = useMutation({
    mutationFn: () =>
      perpPositions.close(position.id, parsed, new Date().toISOString()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perp-positions'] });
      onDone();
    },
  });

  return (
    <div className="flex flex-col gap-2 bg-bg-2 border border-border-1 rounded-sm p-3">
      <p className="text-fg-2 text-[12px]">
        Close <span className="text-fg-1 font-medium">{position.symbol}</span>{' '}
        {position.direction} @ exit price
      </p>
      <Input
        type="number"
        placeholder="Exit price"
        value={exitPrice}
        onChange={(e) => setExitPrice(e.target.value)}
        autoFocus
      />
      {mutation.isError && (
        <p className="text-loss text-[12px]">{String((mutation.error as Error).message)}</p>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button
          type="button"
          variant="primary"
          disabled={!isValid || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Close Position
        </Button>
      </div>
    </div>
  );
}
