export const DEFAULT_MMR = 0.005;

export function liqPrice({
  entry,
  leverage,
  side,
  mmr = DEFAULT_MMR,
}: {
  entry: number;
  leverage: number;
  side: 'long' | 'short';
  mmr?: number;
}): number {
  if (!Number.isFinite(entry) || !Number.isFinite(leverage) || leverage <= 0) {
    return NaN;
  }
  return side === 'long'
    ? entry * (1 - 1 / leverage + mmr)
    : entry * (1 + 1 / leverage - mmr);
}

export function liqDistancePct({
  entry,
  liq,
}: {
  entry: number;
  liq: number;
}): number {
  if (!Number.isFinite(entry) || !Number.isFinite(liq) || entry <= 0) {
    return NaN;
  }
  return (Math.abs(entry - liq) / entry) * 100;
}
