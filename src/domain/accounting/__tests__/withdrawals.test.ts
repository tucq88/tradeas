import { describe, it, expect } from 'vitest';
import { classifyWithdrawal } from '../withdrawals';
import { D } from '@/lib/decimal';

// ---------------------------------------------------------------------------
// Profit-first waterfall: all profit case
// ---------------------------------------------------------------------------

describe('classifyWithdrawal — pure profit withdrawal', () => {
  it('when withdrawal < availableProfit → all realized profit, no principal touched', () => {
    // value = 5000, deposits = 4000, availableProfit = 1000
    // withdraw 500 → realizedProfit = 500, principalTouched = 0
    const result = classifyWithdrawal({
      withdrawalAmount: D('500'),
      valueBeforeWithdrawal: D('5000'),
      depositsBeforeWithdrawal: D('4000'),
    });

    expect(result.availableProfit.toFixed(2)).toBe('1000.00');
    expect(result.realizedProfit.toFixed(2)).toBe('500.00');
    expect(result.principalTouched.toFixed(2)).toBe('0.00');
  });

  it('when withdrawal = availableProfit → all realized profit, no principal touched', () => {
    const result = classifyWithdrawal({
      withdrawalAmount: D('1000'),
      valueBeforeWithdrawal: D('5000'),
      depositsBeforeWithdrawal: D('4000'),
    });

    expect(result.availableProfit.toFixed(2)).toBe('1000.00');
    expect(result.realizedProfit.toFixed(2)).toBe('1000.00');
    expect(result.principalTouched.toFixed(2)).toBe('0.00');
  });
});

// ---------------------------------------------------------------------------
// Mixed: withdrawal exceeds available profit → touches principal
// ---------------------------------------------------------------------------

describe('classifyWithdrawal — partial principal withdrawal', () => {
  it('when withdrawal > availableProfit → realizedProfit caps at availableProfit', () => {
    // value = 5000, deposits = 4000, availableProfit = 1000
    // withdraw 1500 → realizedProfit = 1000, principalTouched = 500
    const result = classifyWithdrawal({
      withdrawalAmount: D('1500'),
      valueBeforeWithdrawal: D('5000'),
      depositsBeforeWithdrawal: D('4000'),
    });

    expect(result.availableProfit.toFixed(2)).toBe('1000.00');
    expect(result.realizedProfit.toFixed(2)).toBe('1000.00');
    expect(result.principalTouched.toFixed(2)).toBe('500.00');
  });
});

// ---------------------------------------------------------------------------
// Full principal withdrawal: value <= deposits → no profit available
// ---------------------------------------------------------------------------

describe('classifyWithdrawal — no available profit', () => {
  it('when value = deposits → availableProfit = 0, all withdrawal is principal', () => {
    const result = classifyWithdrawal({
      withdrawalAmount: D('500'),
      valueBeforeWithdrawal: D('4000'),
      depositsBeforeWithdrawal: D('4000'),
    });

    expect(result.availableProfit.toFixed(2)).toBe('0.00');
    expect(result.realizedProfit.toFixed(2)).toBe('0.00');
    expect(result.principalTouched.toFixed(2)).toBe('500.00');
  });

  it('when value < deposits (underwater) → availableProfit = 0, all withdrawal is principal', () => {
    const result = classifyWithdrawal({
      withdrawalAmount: D('300'),
      valueBeforeWithdrawal: D('3000'),
      depositsBeforeWithdrawal: D('4000'),
    });

    expect(result.availableProfit.toFixed(2)).toBe('0.00');
    expect(result.realizedProfit.toFixed(2)).toBe('0.00');
    expect(result.principalTouched.toFixed(2)).toBe('300.00');
  });
});

// ---------------------------------------------------------------------------
// Notes.ledger-context.md core fixture:
// deposit 4000, grow to 5840, withdraw 500
// availableProfit = 5840 - 4000 = 1840
// withdraw 500 → realizedProfit = 500, principalTouched = 0
// ---------------------------------------------------------------------------

describe('classifyWithdrawal — core fixture from spec', () => {
  it('deposit 4000 @ 1.00, value 5840 before withdrawal of 500', () => {
    // Before withdrawal: sharesHeld = 4000, sharePrice = 1.46
    // valueBeforeWithdrawal = 4000 * 1.46 = 5840
    const result = classifyWithdrawal({
      withdrawalAmount: D('500'),
      valueBeforeWithdrawal: D('5840'),
      depositsBeforeWithdrawal: D('4000'),
    });

    expect(result.availableProfit.toFixed(2)).toBe('1840.00');
    expect(result.realizedProfit.toFixed(2)).toBe('500.00');
    expect(result.principalTouched.toFixed(2)).toBe('0.00');
  });
});

// ---------------------------------------------------------------------------
// String inputs work (Supabase returns strings)
// ---------------------------------------------------------------------------

describe('classifyWithdrawal — accepts string inputs', () => {
  it('accepts string amounts', () => {
    const result = classifyWithdrawal({
      withdrawalAmount: '200',
      valueBeforeWithdrawal: '1500',
      depositsBeforeWithdrawal: '1000',
    });

    expect(result.availableProfit.toFixed(2)).toBe('500.00');
    expect(result.realizedProfit.toFixed(2)).toBe('200.00');
    expect(result.principalTouched.toFixed(2)).toBe('0.00');
  });
});

// ---------------------------------------------------------------------------
// High-precision Decimal arithmetic (no float errors)
// ---------------------------------------------------------------------------

describe('classifyWithdrawal — decimal precision', () => {
  it('handles fractional amounts without floating-point error', () => {
    // This would produce incorrect results with native JS floats
    const result = classifyWithdrawal({
      withdrawalAmount: D('0.1').add(D('0.2')), // 0.3 exactly in Decimal
      valueBeforeWithdrawal: D('1000'),
      depositsBeforeWithdrawal: D('999.5'),
    });

    // availableProfit = 1000 - 999.5 = 0.5
    // withdrawal 0.3 < 0.5 → all profit
    expect(result.availableProfit.toFixed(1)).toBe('0.5');
    expect(result.realizedProfit.toFixed(1)).toBe('0.3');
    expect(result.principalTouched.toFixed(1)).toBe('0.0');
  });
});

// ---------------------------------------------------------------------------
// Zero withdrawal edge case
// ---------------------------------------------------------------------------

describe('classifyWithdrawal — zero withdrawal', () => {
  it('zero withdrawal → all zeros', () => {
    const result = classifyWithdrawal({
      withdrawalAmount: D('0'),
      valueBeforeWithdrawal: D('5000'),
      depositsBeforeWithdrawal: D('4000'),
    });

    expect(result.availableProfit.toFixed(2)).toBe('1000.00');
    expect(result.realizedProfit.toFixed(2)).toBe('0.00');
    expect(result.principalTouched.toFixed(2)).toBe('0.00');
  });
});
