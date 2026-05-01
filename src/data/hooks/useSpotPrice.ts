import { useQuery } from '@tanstack/react-query';
import { getSpotPrice, getSpotPrices } from '@/data/binance/spot';
import { BinanceError } from '@/data/binance/errors';

function retryFn(failureCount: number, err: unknown): boolean {
  return err instanceof BinanceError && err.kind !== 'unknown-symbol' && failureCount < 1;
}

export function spotPriceKey(symbol: string) {
  return ['binance', 'spot', 'price', symbol] as const;
}

export function spotPricesKey(symbols: string[]) {
  return ['binance', 'spot', 'prices', [...symbols].sort().join(',')] as const;
}

export function useSpotPrice(symbol: string) {
  const sym = symbol.toUpperCase();
  return useQuery({
    queryKey: spotPriceKey(sym),
    queryFn: () => getSpotPrice(sym),
    retry: retryFn,
  });
}

export function useSpotPrices(symbols: string[]) {
  const syms = symbols.map((s) => s.toUpperCase());
  return useQuery({
    queryKey: spotPricesKey(syms),
    queryFn: () => getSpotPrices(syms),
    retry: retryFn,
    enabled: syms.length > 0,
  });
}
