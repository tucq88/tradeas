import { useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function getSnapshot(client: ReturnType<typeof useQueryClient>): number | null {
  const queries = client.getQueryCache().findAll({ queryKey: ['binance'] });
  if (queries.length === 0) return null;
  let max = 0;
  for (const q of queries) {
    const t = q.state.dataUpdatedAt;
    if (t > max) max = t;
  }
  return max > 0 ? max : null;
}

export function useLastRefreshed(): Date | null {
  const client = useQueryClient();
  const cache = client.getQueryCache();

  const ts = useSyncExternalStore(
    (notify) => cache.subscribe(notify),
    () => getSnapshot(client),
    () => null,
  );

  return ts !== null ? new Date(ts) : null;
}
