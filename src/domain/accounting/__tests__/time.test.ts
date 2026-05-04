import { describe, it, expect } from 'vitest';
import { weekBoundaries, weekStartFor } from '../time';

describe('weekStartFor', () => {
  it('returns the Sunday start of the week for a midweek date (UTC)', () => {
    // 2024-01-10 is a Wednesday; Sunday was 2024-01-07
    const result = weekStartFor('2024-01-10T12:00:00Z', 'sunday', 'UTC');
    expect(result.startsWith('2024-01-07')).toBe(true);
  });

  it('returns the same day when asOf is already Sunday', () => {
    const result = weekStartFor('2024-01-07T08:00:00Z', 'sunday', 'UTC');
    expect(result.startsWith('2024-01-07')).toBe(true);
  });

  it('uses Monday as week start when specified', () => {
    // 2024-01-10 Wednesday → Monday was 2024-01-08
    const result = weekStartFor('2024-01-10T12:00:00Z', 'monday', 'UTC');
    expect(result.startsWith('2024-01-08')).toBe(true);
  });

  it('returns Saturday start for a Sunday when weekStartDay=monday', () => {
    // 2024-01-07 Sunday → previous Monday was 2024-01-01
    const result = weekStartFor('2024-01-07T12:00:00Z', 'monday', 'UTC');
    expect(result.startsWith('2024-01-01')).toBe(true);
  });
});

describe('weekBoundaries', () => {
  it('end is exactly 7 days after start', () => {
    const { start, end } = weekBoundaries('2024-01-10T12:00:00Z', { timezone: 'UTC' });
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    expect(diffMs).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('start and end bracket the asOf date', () => {
    const asOf = '2024-01-10T12:00:00Z';
    const { start, end } = weekBoundaries(asOf, { timezone: 'UTC' });
    expect(new Date(start).getTime()).toBeLessThanOrEqual(new Date(asOf).getTime());
    expect(new Date(end).getTime()).toBeGreaterThan(new Date(asOf).getTime());
  });

  it('defaults to UTC and sunday', () => {
    const { start } = weekBoundaries('2024-01-10T00:00:00Z');
    expect(start.startsWith('2024-01-07')).toBe(true);
  });
});
