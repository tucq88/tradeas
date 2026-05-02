import type { PerpPosition } from '@/data/types';
import { realizedPnl } from './compute';

export type ClosedRow = {
  position: PerpPosition;
  pnl: number;
  roi: number;
};

export type ClosedSummary = {
  rows: ClosedRow[];
  totalPnl: number;
  avgPnl: number;
  bestPnl: number;
  worstPnl: number;
  count: number;
  wins: number;
  losses: number;
  winRate: number; // 0..1, 0 when count === 0
};

export function summarizeClosed(positions: PerpPosition[]): ClosedSummary {
  const rows: ClosedRow[] = [];

  for (const position of positions) {
    const pnl = realizedPnl(position);
    if (pnl === null) continue; // skip rows where exit_price == null

    const roi = position.size_usdt > 0 ? pnl / position.size_usdt : 0;
    rows.push({ position, pnl, roi });
  }

  // Sort by closed_at desc; null closed_at falls to the bottom
  rows.sort((a, b) => {
    const ca = a.position.closed_at;
    const cb = b.position.closed_at;
    if (ca === null && cb === null) return 0;
    if (ca === null) return 1;
    if (cb === null) return -1;
    return cb < ca ? -1 : cb > ca ? 1 : 0;
  });

  const count = rows.length;

  if (count === 0) {
    return {
      rows: [],
      totalPnl: 0,
      avgPnl: 0,
      bestPnl: 0,
      worstPnl: 0,
      count: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    };
  }

  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0);
  const avgPnl = totalPnl / count;
  const bestPnl = rows.reduce((best, r) => (r.pnl > best ? r.pnl : best), rows[0].pnl);
  const worstPnl = rows.reduce((worst, r) => (r.pnl < worst ? r.pnl : worst), rows[0].pnl);
  const wins = rows.filter((r) => r.pnl > 0).length;
  const losses = rows.filter((r) => r.pnl < 0).length;
  const winRate = wins / count;

  return { rows, totalPnl, avgPnl, bestPnl, worstPnl, count, wins, losses, winRate };
}
