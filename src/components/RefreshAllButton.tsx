import { useRef, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/ui/Button';

export function RefreshAllButton() {
  const qc = useQueryClient();
  const lockRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastFiredAt, setLastFiredAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (lastFiredAt === null) return;
    const id = setInterval(() => {
      setElapsed(Math.round((Date.now() - lastFiredAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastFiredAt]);

  function handleClick() {
    if (lockRef.current) return;
    void qc.invalidateQueries({
      predicate: (q) => q.queryKey[0] === 'binance' || q.queryKey[0] === 'coingecko',
    });
    setLastFiredAt(Date.now());
    setElapsed(0);
    lockRef.current = setTimeout(() => {
      lockRef.current = null;
    }, 1000);
  }

  return (
    <div className="flex items-center gap-2">
      {lastFiredAt !== null && (
        <span className="text-fg-3 text-[11px]">{elapsed}s ago</span>
      )}
      <Button onClick={handleClick}>Refresh All</Button>
    </div>
  );
}
