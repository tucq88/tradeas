import { useQuery } from '@tanstack/react-query';
import { getCoinPrices } from '@/data/coingecko/spot';

export function coingeckoPricesKey(ids: string[]) {
  return ['coingecko', 'prices', [...ids].sort().join(',')] as const;
}

export function useCoingeckoPrices(ids: string[]) {
  const sorted = [...ids].sort();
  return useQuery({
    queryKey: coingeckoPricesKey(sorted),
    queryFn: () => getCoinPrices(sorted),
    enabled: sorted.length > 0,
  });
}
