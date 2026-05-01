import { fetchJson } from './client';
import { BinanceError } from './errors';

const BASE = 'https://api.binance.com/api/v3/ticker/price';

interface TickerPrice {
  symbol: string;
  price: string;
}

export async function getSpotPrice(symbol: string): Promise<number> {
  const data = await fetchJson<TickerPrice>(`${BASE}?symbol=${symbol}`);
  const price = Number(data.price);
  if (Number.isNaN(price)) throw new BinanceError('http', 'Invalid price data');
  return price;
}

export async function getSpotPrices(symbols: string[]): Promise<Record<string, number>> {
  const sorted = [...symbols].sort();
  const encoded = encodeURIComponent(JSON.stringify(sorted));
  const data = await fetchJson<TickerPrice[]>(`${BASE}?symbols=${encoded}`);
  const result: Record<string, number> = {};
  for (const item of data) {
    const price = Number(item.price);
    if (Number.isNaN(price)) throw new BinanceError('http', 'Invalid price data');
    result[item.symbol] = price;
  }
  return result;
}
