import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULTS, STORAGE_KEY, loadFromStorage, update } from '../settings';

beforeEach(() => {
  localStorage.clear();
});

describe('STORAGE_KEY', () => {
  it('is exactly tradeas:settings:v2', () => {
    expect(STORAGE_KEY).toBe('tradeas:settings:v2');
  });
});

describe('loadFromStorage', () => {
  it('returns defaults when storage is empty', () => {
    const s = loadFromStorage();
    expect(s).toEqual(DEFAULTS);
  });

  it('merges stored values over defaults', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ riskPct: 5 }));
    const s = loadFromStorage();
    expect(s.riskPct).toBe(5);
    expect(s.accountBalanceUsd).toBe(DEFAULTS.accountBalanceUsd);
    expect(s.mmrPct).toBe(DEFAULTS.mmrPct);
    expect(s.refreshSec).toBe(DEFAULTS.refreshSec);
  });

  it('partial object missing mmrPct fills from defaults', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accountBalanceUsd: 500, riskPct: 1, refreshSec: 60 }),
    );
    const s = loadFromStorage();
    expect(s.mmrPct).toBe(0.5);
  });

  it('malformed JSON falls back to defaults without crash', () => {
    localStorage.setItem(STORAGE_KEY, '{');
    const s = loadFromStorage();
    expect(s).toEqual(DEFAULTS);
  });
});

describe('update', () => {
  it('persists to localStorage under the correct key', () => {
    update({ riskPct: 5 });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.riskPct).toBe(5);
  });

  it('round-trip: all fields present after partial update', () => {
    update({ accountBalanceUsd: 2500 });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.accountBalanceUsd).toBe(2500);
    expect(typeof stored.mmrPct).toBe('number');
    expect(typeof stored.refreshSec).toBe('number');
  });
});
