export function toBinancePair(base: string): string {
  const normalized = base.trim().toUpperCase();
  if (!normalized || !/^[A-Z0-9]+$/.test(normalized)) {
    throw new Error(`Invalid base symbol: "${base}"`);
  }
  return `${normalized}USDT`;
}

export function fromBinancePair(pair: string): string {
  if (!pair.endsWith('USDT')) {
    throw new Error(`Pair "${pair}" does not end with USDT`);
  }
  return pair.slice(0, -4);
}
