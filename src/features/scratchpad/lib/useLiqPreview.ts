import { liqPrice, liqDistancePct, DEFAULT_MMR } from '@/lib/liq';

type Inputs = {
  side: 'long' | 'short';
  entry: string;
  stop: string;
  leverage: string;
};

export type LiqPreview = {
  errors: string[];
  hasBase: boolean;
  baseLiq: number | null;
  baseLiqDist: number | null;
  stopBeyondLiq: boolean;
};

export function useLiqPreview({ side, entry, stop, leverage }: Inputs): LiqPreview {
  const entryNum = parseFloat(entry);
  const stopNum = parseFloat(stop);
  const levNum = parseFloat(leverage);

  const errors: string[] = [];
  if (entry !== '' && (isNaN(entryNum) || entryNum <= 0)) errors.push('Entry price must be > 0');
  if (leverage !== '' && (isNaN(levNum) || levNum <= 0)) errors.push('Leverage must be > 0');
  if (
    entry !== '' && stop !== '' &&
    !isNaN(entryNum) && entryNum > 0 &&
    !isNaN(stopNum) && stopNum > 0
  ) {
    if (side === 'long' && stopNum >= entryNum) errors.push('Stop must be below entry for long');
    if (side === 'short' && stopNum <= entryNum) errors.push('Stop must be above entry for short');
  }

  const effectiveLev = isNaN(levNum) || levNum <= 0 ? 10 : levNum;
  const hasBase = Number.isFinite(entryNum) && entryNum > 0;
  const baseLiq = hasBase
    ? liqPrice({ entry: entryNum, leverage: effectiveLev, side, mmr: DEFAULT_MMR })
    : null;
  const baseLiqDist = baseLiq !== null ? liqDistancePct({ entry: entryNum, liq: baseLiq }) : null;

  const stopBeyondLiq =
    baseLiq !== null &&
    Number.isFinite(stopNum) &&
    stopNum > 0 &&
    errors.length === 0 &&
    ((side === 'long' && stopNum <= baseLiq) || (side === 'short' && stopNum >= baseLiq));

  return { errors, hasBase, baseLiq, baseLiqDist, stopBeyondLiq };
}
