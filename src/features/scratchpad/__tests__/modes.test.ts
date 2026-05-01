import { describe, it, expect } from 'vitest';
import { computeClassic } from '../modes/Classic';
import { computeStopFirst } from '../modes/StopFirst';
import { computeSizeFirst } from '../modes/SizeFirst';

describe('computeClassic', () => {
  const base = {
    side: 'long' as const,
    entry: 100,
    stop: 95,
    leverage: 10,
    balance: 10000,
    riskPct: 2,
  };

  it('golden numbers', () => {
    const out = computeClassic(base);
    expect(out).not.toBeNull();
    expect(out!.riskUsd).toBeCloseTo(200);
    expect(out!.qty).toBeCloseTo(40);
    expect(out!.notional).toBeCloseTo(4000);
    expect(out!.liq).toBeCloseTo(90.5);
    expect(out!.r1).toBeCloseTo(105);
    expect(out!.r2).toBeCloseTo(110);
    expect(out!.r3).toBeCloseTo(115);
  });

  it('wrong-side stop long (stop = entry) → null', () => {
    expect(computeClassic({ ...base, stop: 100 })).toBeNull();
  });

  it('wrong-side stop long (stop > entry) → null', () => {
    expect(computeClassic({ ...base, stop: 105 })).toBeNull();
  });

  it('wrong-side stop short (stop = entry) → null', () => {
    expect(computeClassic({ ...base, side: 'short', stop: 100 })).toBeNull();
  });

  it('wrong-side stop short (stop < entry) → null', () => {
    expect(computeClassic({ ...base, side: 'short', stop: 95 })).toBeNull();
  });

  it('short targets go below entry', () => {
    const out = computeClassic({ ...base, side: 'short', stop: 105 });
    expect(out).not.toBeNull();
    expect(out!.r1).toBeCloseTo(95);
    expect(out!.r2).toBeCloseTo(90);
    expect(out!.r3).toBeCloseTo(85);
  });
});

describe('computeStopFirst', () => {
  const base = {
    side: 'long' as const,
    entry: 100,
    stop: 95,
    leverage: 10,
    balance: 10000,
    riskPct: 2,
  };

  it('golden numbers', () => {
    const out = computeStopFirst(base);
    expect(out).not.toBeNull();
    expect(out!.qty).toBeCloseTo(40);
    expect(out!.notional).toBeCloseTo(4000);
    expect(out!.margin).toBeCloseTo(400);
  });

  it('wrong-side stop → null', () => {
    expect(computeStopFirst({ ...base, stop: 105 })).toBeNull();
  });
});

describe('computeSizeFirst', () => {
  const base = {
    side: 'long' as const,
    entry: 100,
    stop: 95,
    leverage: 10,
    sizeUsdt: 5000,
    balance: 10000,
  };

  it('golden numbers', () => {
    const out = computeSizeFirst(base);
    expect(out).not.toBeNull();
    expect(out!.qty).toBeCloseTo(50);
    expect(out!.riskUsd).toBeCloseTo(250);
  });

  it('wrong-side stop → null', () => {
    expect(computeSizeFirst({ ...base, stop: 105 })).toBeNull();
  });
});
