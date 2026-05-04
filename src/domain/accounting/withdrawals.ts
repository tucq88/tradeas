import { D, max, min } from '@/lib/decimal';
import type { Decimal } from '@/lib/decimal';
import type { WithdrawalClassification } from './types';

/**
 * Profit-first withdrawal waterfall.
 *
 * Determines how much of a withdrawal comes from profit versus principal.
 * All inputs must be non-negative Decimal values.
 *
 * Formulas:
 *   availableProfit = max(0, valueBeforeWithdrawal − depositsBeforeWithdrawal)
 *   realizedProfit  = min(withdrawalAmount, availableProfit)
 *   principalTouched = max(0, withdrawalAmount − realizedProfit)
 */
export function classifyWithdrawal({
  withdrawalAmount,
  valueBeforeWithdrawal,
  depositsBeforeWithdrawal,
}: {
  withdrawalAmount: Decimal | string;
  valueBeforeWithdrawal: Decimal | string;
  depositsBeforeWithdrawal: Decimal | string;
}): WithdrawalClassification {
  const amount = D(withdrawalAmount);
  const value = D(valueBeforeWithdrawal);
  const deposits = D(depositsBeforeWithdrawal);

  const availableProfit = max(D(0), value.sub(deposits));
  const realizedProfit = min(amount, availableProfit);
  const principalTouched = max(D(0), amount.sub(realizedProfit));

  return { availableProfit, realizedProfit, principalTouched };
}
