import { describe, it, expect } from 'vitest';
import { liqPrice, liqDistancePct, DEFAULT_MMR } from '../liq';

describe('liqPrice', () => {
  it('DEFAULT_MMR is 0.005', () => {
    expect(DEFAULT_MMR).toBe(0.005);
  });

  it('long leverage 10 → 90.5', () => {
    expect(liqPrice({ entry: 100, leverage: 10, side: 'long' })).toBeCloseTo(90.5);
  });

  it('short leverage 10 → 109.5', () => {
    expect(liqPrice({ entry: 100, leverage: 10, side: 'short' })).toBeCloseTo(109.5);
  });

  it('long leverage 1 → 0.5', () => {
    expect(liqPrice({ entry: 100, leverage: 1, side: 'long' })).toBeCloseTo(0.5);
  });

  it('short leverage 1 → 199.5', () => {
    expect(liqPrice({ entry: 100, leverage: 1, side: 'short' })).toBeCloseTo(199.5);
  });

  it('long leverage 5 → 80.5', () => {
    expect(liqPrice({ entry: 100, leverage: 5, side: 'long' })).toBeCloseTo(80.5);
  });

  it('long leverage 25 → 96.5', () => {
    expect(liqPrice({ entry: 100, leverage: 25, side: 'long' })).toBeCloseTo(96.5);
  });

  it('zero leverage returns NaN', () => {
    expect(liqPrice({ entry: 100, leverage: 0, side: 'long' })).toBeNaN();
  });

  it('negative leverage returns NaN', () => {
    expect(liqPrice({ entry: 100, leverage: -5, side: 'long' })).toBeNaN();
  });
});

describe('liqDistancePct', () => {
  it('long at leverage 10 → 9.5%', () => {
    const liq = liqPrice({ entry: 100, leverage: 10, side: 'long' });
    expect(liqDistancePct({ entry: 100, liq })).toBeCloseTo(9.5);
  });

  it('short at leverage 10 → 9.5%', () => {
    const liq = liqPrice({ entry: 100, leverage: 10, side: 'short' });
    expect(liqDistancePct({ entry: 100, liq })).toBeCloseTo(9.5);
  });
});
