import { D } from '@/lib/decimal';

type SnapshotLike = { id: string; snapshot_at: string };

/**
 * Returns the most recent snapshot whose snapshot_at <= asOf, or null when
 * none exists. Snapshots with archived_at set are excluded by the caller;
 * this function does not filter archived rows.
 *
 * Tie-break: highest snapshot_at wins. If two snapshots share the same
 * snapshot_at the one with the lexicographically larger id wins (stable sort).
 */
export function latestAtOrBefore<T extends SnapshotLike>(
  snapshots: T[],
  asOf: string,
): T | null {
  const asOfMs = new Date(asOf).getTime();
  const candidates = snapshots.filter((s) => new Date(s.snapshot_at).getTime() <= asOfMs);
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const tA = new Date(a.snapshot_at).getTime();
    const tB = new Date(b.snapshot_at).getTime();
    if (tA !== tB) return tB - tA; // descending by time
    return a.id < b.id ? 1 : -1; // descending by id as tiebreak
  });

  return candidates[0];
}

/**
 * Returns true when the snapshot is older than staleAfterDays days relative
 * to asOf. Both dates are ISO 8601 strings.
 */
export function isStale(
  snapshotAt: string,
  asOf: string,
  staleAfterDays: number,
): boolean {
  const snapshotMs = new Date(snapshotAt).getTime();
  const asOfMs = new Date(asOf).getTime();
  const MS_PER_DAY = 86400000; // 24 * 60 * 60 * 1000
  const diffDays = D(asOfMs - snapshotMs).div(D(MS_PER_DAY));
  return diffDays.gt(D(staleAfterDays));
}
