import { describe, it, expect } from 'vitest';
import { classifyWithdrawal } from '@/domain/accounting/withdrawals';
import { D } from '@/lib/decimal';

// Vault deposit: 4000 USDC @ SP 1.00 → 4000 shares
// Vault withdrawal: 500 USDC @ SP 1.46 → ~342.4658 shares burned
// Preview: realizedProfit=500, principalTouched=0, remainingShares≈3657.5342

describe('withdrawal preview accounting', () => {
  it('classifies profit-only withdrawal correctly', () => {
    const sharesHeld = D(4000);
    const sharePrice = D('1.46');
    const usdcAmount = D(500);
    const totalDeposited = D(4000);

    const valueBeforeWithdrawal = sharesHeld.mul(sharePrice); // 5840
    const result = classifyWithdrawal({
      withdrawalAmount: usdcAmount,
      valueBeforeWithdrawal,
      depositsBeforeWithdrawal: totalDeposited,
    });

    expect(result.realizedProfit.toFixed(2)).toBe('500.00');
    expect(result.principalTouched.toFixed(2)).toBe('0.00');
    expect(result.availableProfit.toFixed(2)).toBe('1840.00');
  });

  it('computes burned and remaining shares', () => {
    const sharesHeld = D(4000);
    const sharePrice = D('1.46');
    const usdcAmount = D(500);

    const burnedShares = usdcAmount.div(sharePrice);
    const remainingShares = sharesHeld.sub(burnedShares);

    expect(parseFloat(burnedShares.toFixed(6))).toBeCloseTo(342.4658, 3);
    expect(parseFloat(remainingShares.toFixed(6))).toBeCloseTo(3657.5342, 3);
  });

  it('touches principal when withdrawal exceeds available profit', () => {
    const sharesHeld = D(1000);
    const sharePrice = D('1.00');
    const usdcAmount = D(1200);
    const totalDeposited = D(1000);

    const valueBeforeWithdrawal = sharesHeld.mul(sharePrice); // 1000
    const result = classifyWithdrawal({
      withdrawalAmount: usdcAmount,
      valueBeforeWithdrawal,
      depositsBeforeWithdrawal: totalDeposited,
    });

    expect(result.realizedProfit.toFixed(2)).toBe('0.00');
    expect(result.principalTouched.toFixed(2)).toBe('1200.00');
  });

  it('splits between profit and principal correctly', () => {
    // deposited 1000, current value 1300, withdraw 600
    const result = classifyWithdrawal({
      withdrawalAmount: D(600),
      valueBeforeWithdrawal: D(1300),
      depositsBeforeWithdrawal: D(1000),
    });

    expect(result.availableProfit.toFixed(2)).toBe('300.00');
    expect(result.realizedProfit.toFixed(2)).toBe('300.00');
    expect(result.principalTouched.toFixed(2)).toBe('300.00');
  });
});
