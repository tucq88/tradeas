import { useQuery } from '@tanstack/react-query';
import { getMarkPrice, getMarkPrices } from '@/data/binance/futures';
import { BinanceError } from '@/data/binance/errors';

function retryFn(failureCount: number, err: unknown): boolean {
  return err instanceof BinanceError && err.kind !== 'unknown-symbol' && failureCount < 1;
}

export function markPriceKey(symbol: string) {
  return ['binance', 'futures', 'mark', symbol] as const;
}

export const markPricesKey = ['binance', 'futures', 'mark', 'all'] as const;

export function useMarkPrice(symbol: string) {
  const sym = symbol.toUpperCase();
  return useQuery({
    queryKey: markPriceKey(sym),
    queryFn: () => getMarkPrice(sym),
    retry: retryFn,
  });
}

export function useMarkPrices(symbols: string[]) {
  const syms = symbols.map((s) => s.toUpperCase());
  return useQuery({
    queryKey: [...markPricesKey],
    queryFn: async () => getMarkPrices(syms),
    retry: retryFn,
    enabled: syms.length > 0,
  });
}
