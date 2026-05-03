import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useRefreshAllPrices() {
  const client = useQueryClient();
  const refresh = useCallback(() => {
    void client.invalidateQueries({ queryKey: ['binance'] });
    void client.invalidateQueries({ queryKey: ['coingecko', 'prices'] });
  }, [client]);
  return { refresh };
}
