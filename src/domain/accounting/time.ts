export type WeekStartDay = 'sunday' | 'monday';

const DAY_INDEX: Record<WeekStartDay, number> = { sunday: 0, monday: 1 };

/**
 * Returns the ISO timestamp for the start of the week containing `asOf`,
 * anchored to midnight in `timezone`. The week starts on `weekStartDay`.
 */
export function weekStartFor(
  asOf: string,
  weekStartDay: WeekStartDay = 'sunday',
  timezone: string = 'UTC',
): string {
  // Parse the date in the target timezone to find its local calendar components
  const date = new Date(asOf);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const y = Number(parts.find((p) => p.type === 'year')!.value);
  const m = Number(parts.find((p) => p.type === 'month')!.value) - 1;
  const d = Number(parts.find((p) => p.type === 'day')!.value);

  // Build midnight-local for the date in question (use Intl to find UTC offset)
  const localMidnight = new Date(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00`);
  const utcMidnight = toUTCMidnight(y, m + 1, d, timezone);

  // Day-of-week in local timezone
  const dayOfWeek = utcMidnight.getDay(); // 0 = Sun
  const startDayIdx = DAY_INDEX[weekStartDay];
  const daysBack = (dayOfWeek - startDayIdx + 7) % 7;

  // Move back to the week's start
  const startMs = utcMidnight.getTime() - daysBack * 86400000;
  void localMidnight; // suppress unused-var
  return new Date(startMs).toISOString();
}

/**
 * Returns `{ start, end }` ISO timestamps for the week containing `asOf`.
 * `end` is exclusive (= start of the following week).
 */
export function weekBoundaries(
  asOf: string,
  options: { weekStartDay?: WeekStartDay; timezone?: string } = {},
): { start: string; end: string } {
  const { weekStartDay = 'sunday', timezone = 'UTC' } = options;
  const start = weekStartFor(asOf, weekStartDay, timezone);
  const end = new Date(new Date(start).getTime() + 7 * 86400000).toISOString();
  return { start, end };
}

/** Converts a local calendar date to its UTC midnight equivalent via Intl offset detection. */
function toUTCMidnight(year: number, month: number, day: number, timezone: string): Date {
  // Create a reference point at noon (avoids DST boundary issues at midnight)
  const noonUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Find the UTC offset at that point by formatting in the target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(noonUTC);
  const localHour = Number(parts.find((p) => p.type === 'hour')!.value);
  const localMinute = Number(parts.find((p) => p.type === 'minute')!.value);

  // UTC offset in minutes: noon UTC minus local noon = offset
  const offsetMs = (12 * 60 - (localHour * 60 + localMinute)) * 60000;

  // UTC equivalent of local midnight = local midnight UTC offset correction
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) + offsetMs);
}
