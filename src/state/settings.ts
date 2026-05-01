import { useSyncExternalStore } from 'react';

export type Settings = {
  accountBalanceUsd: number;
  riskPct: number;
  mmrPct: number;
  refreshSec: number;
};

export const STORAGE_KEY = 'tu.tradeas:settings:v1';

export const DEFAULTS: Settings = {
  accountBalanceUsd: 1000,
  riskPct: 2,
  mmrPct: 0.5,
  refreshSec: 30,
};

export function loadFromStorage(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

let current: Settings = loadFromStorage();
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((fn) => fn());
}

export function update(patch: Partial<Settings>): void {
  current = { ...current, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  notify();
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function getSnapshot(): Settings {
  return current;
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const settings = useSyncExternalStore(subscribe, getSnapshot);
  return [settings, update];
}
