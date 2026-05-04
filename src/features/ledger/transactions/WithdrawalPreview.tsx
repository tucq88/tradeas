import { D, max } from '@/lib/decimal';
import { classifyWithdrawal } from '@/domain/accounting/withdrawals';
import type { LedgerTransaction } from '@/data/ledger/types';

type Props = {
  productId: string;
  transactions: LedgerTransaction[];
  usdcAmount: string;
  sharePrice: string;
};

function computePreviewBase(transactions: LedgerTransaction[], productId: string) {
  let sharesHeld = D(0);
  let totalDeposited = D(0);
  for (const tx of transactions) {
    if (tx.product_id !== productId || tx.archived_at) continue;
    if (tx.kind === 'deposit') {
      totalDeposited = totalDeposited.add(D(tx.usdc_amount));
      if (tx.shares_delta) sharesHeld = sharesHeld.add(D(tx.shares_delta));
      else if (tx.share_price) sharesHeld = sharesHeld.add(D(tx.usdc_amount).div(D(tx.share_price)));
    } else if (tx.kind === 'withdrawal') {
      if (tx.shares_delta) sharesHeld = sharesHeld.sub(D(tx.shares_delta));
      else if (tx.share_price) sharesHeld = sharesHeld.sub(D(tx.usdc_amount).div(D(tx.share_price)));
    }
  }
  return { sharesHeld: max(D(0), sharesHeld), totalDeposited };
}

const DASH = '—';

function fmt6(d: ReturnType<typeof D>) {
  return d.toFixed(6);
}

function fmt2(d: ReturnType<typeof D>) {
  return d.toFixed(2);
}

export function WithdrawalPreview({ productId, transactions, usdcAmount, sharePrice }: Props) {
  const usdcNum = parseFloat(usdcAmount);
  const spNum = parseFloat(sharePrice);

  const ready = !isNaN(usdcNum) && usdcNum > 0 && !isNaN(spNum) && spNum > 0;

  const { sharesHeld, totalDeposited } = computePreviewBase(transactions, productId);

  let burnedShares = DASH;
  let remainingShares = DASH;
  let realizedProfit = DASH;
  let principalTouched = DASH;

  if (ready) {
    const sp = D(spNum);
    const amount = D(usdcNum);
    const burned = amount.div(sp);
    const remaining = max(D(0), sharesHeld.sub(burned));
    const valueBeforeWithdrawal = sharesHeld.mul(sp);
    const classification = classifyWithdrawal({
      withdrawalAmount: amount,
      valueBeforeWithdrawal,
      depositsBeforeWithdrawal: totalDeposited,
    });

    burnedShares = fmt6(burned);
    remainingShares = fmt6(remaining);
    realizedProfit = fmt2(classification.realizedProfit);
    principalTouched = fmt2(classification.principalTouched);
  }

  return (
    <div className="rounded-sm bg-bg-inset border border-border-1 p-3 text-[12px] font-mono">
      <p className="text-fg-3 mb-2 text-[11px] uppercase tracking-wide">withdrawal preview</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        <span className="text-fg-3">burned shares</span>
        <span className="text-fg-1 text-right">{burnedShares}</span>
        <span className="text-fg-3">remaining shares</span>
        <span className="text-fg-1 text-right">{remainingShares}</span>
        <span className="text-fg-3">realized profit</span>
        <span className="text-gain text-right">{realizedProfit === DASH ? DASH : `$${realizedProfit}`}</span>
        <span className="text-fg-3">principal touched</span>
        <span className="text-right">{principalTouched === DASH ? DASH : `$${principalTouched}`}</span>
      </div>
    </div>
  );
}

