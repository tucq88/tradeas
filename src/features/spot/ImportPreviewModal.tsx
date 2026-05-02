import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { spotLots } from '@/data/spotLots';
import type { SpotLotInput } from '@/data/types';
import { Button } from '@/ui/Button';

type Props = {
  valid: SpotLotInput[];
  errors: string[];
  onClose: () => void;
};

const MAX_ERRORS_SHOWN = 20;

export function ImportPreviewModal({ valid, errors, onClose }: Props) {
  const qc = useQueryClient();
  const totalRows = valid.length + errors.length;
  const shownErrors = errors.slice(0, MAX_ERRORS_SHOWN);
  const hiddenCount = errors.length - shownErrors.length;

  const mutation = useMutation({
    mutationFn: () => spotLots.bulkCreate(valid),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['spot-lots'] });
      onClose();
    },
  });

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mutation.isPending) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, mutation.isPending]);

  const confirmLabel =
    errors.length > 0
      ? `import ${valid.length} valid lots (skip ${errors.length} errors)`
      : `import ${valid.length} valid lots`;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget && !mutation.isPending) onClose(); }}
    >
      <div className="bg-bg-1 border border-border-1 rounded-sm p-4 w-full max-w-md flex flex-col gap-3 shadow-xl">
        <p className="text-fg-1 text-[13px] font-semibold">import preview</p>

        <div className="flex gap-4 text-[12px]">
          <span className="text-fg-3">total rows: <span className="text-fg-1">{totalRows}</span></span>
          <span className="text-profit">valid: {valid.length}</span>
          {errors.length > 0 && <span className="text-loss">errors: {errors.length}</span>}
        </div>

        {shownErrors.length > 0 && (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto bg-bg-2 rounded-sm p-2">
            {shownErrors.map((err, i) => (
              <p key={i} className="text-loss text-[11px] font-mono">{err}</p>
            ))}
            {hiddenCount > 0 && (
              <p className="text-fg-3 text-[11px]">+{hiddenCount} more</p>
            )}
          </div>
        )}

        {mutation.isError && (
          <p className="text-loss text-[12px]">
            import failed: {(mutation.error as Error).message}
          </p>
        )}

        <div className="flex gap-2 justify-end mt-1">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            cancel
          </Button>
          <Button
            variant="primary"
            disabled={valid.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'importing…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
