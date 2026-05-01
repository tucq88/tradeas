import { liqPrice } from '@/lib/liq';
import type { PerpPosition } from '@/data/types';
import type { Settings } from '@/state/settings';

export function effectiveMmr(row: PerpPosition, settings: Settings): number {
  return row.mmr_override ?? settings.mmrPct / 100;
}

export function unrealizedPnl(row: PerpPosition, markPrice: number): number {
  const { direction, entry_price: entry, leverage, size_usdt } = row;
  const contractSize = size_usdt * leverage / entry;
  return direction === 'long'
    ? (markPrice - entry) * contractSize
    : (entry - markPrice) * contractSize;
}

export function realizedPnl(row: PerpPosition): number | null {
  if (row.exit_price == null) return null;
  const { direction, entry_price: entry, leverage, size_usdt, exit_price } = row;
  const contractSize = size_usdt * leverage / entry;
  return direction === 'long'
    ? (exit_price - entry) * contractSize
    : (entry - exit_price) * contractSize;
}

export function computeLiqDistance(
  row: PerpPosition,
  markPrice: number,
  mmr: number,
): number {
  const liq = liqPrice({
    entry: row.entry_price,
    leverage: row.leverage,
    side: row.direction,
    mmr,
  });
  return row.direction === 'long'
    ? (markPrice - liq) / markPrice
    : (liq - markPrice) / markPrice;
}

export function isLiqWarn(liqDist: number): boolean {
  return Math.abs(liqDist) <= 0.10;
}
