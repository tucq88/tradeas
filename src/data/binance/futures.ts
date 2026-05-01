import { fetchJson } from './client';
import { BinanceError } from './errors';

const BASE = 'https://fapi.binance.com/fapi/v1/premiumIndex';

interface PremiumIndex {
  symbol: string;
  markPrice: string;
}

export async function getMarkPrice(symbol: string): Promise<number> {
  const data = await fetchJson<PremiumIndex>(`${BASE}?symbol=${symbol}`);
  const price = Number(data.markPrice);
  if (Number.isNaN(price)) throw new BinanceError('http', 'Invalid mark price data');
  return price;
}

export async function getMarkPrices(symbols: string[]): Promise<Record<string, number>> {
  const universe = await fetchJson<PremiumIndex[]>(BASE);
  const requested = new Set(symbols);
  const result: Record<string, number> = {};
  for (const item of universe) {
    if (requested.has(item.symbol)) {
      const price = Number(item.markPrice);
      if (Number.isNaN(price)) throw new BinanceError('http', 'Invalid mark price data');
      result[item.symbol] = price;
    }
  }
  return result;
}
