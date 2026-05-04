import { useMemo } from 'react';
import { D, max } from '@/lib/decimal';
import type { Decimal } from '@/lib/decimal';
import { computeVaultPosition } from '@/domain/accounting/vault';
import { computeAgentPosition } from '@/domain/accounting/agent';
import type { AccountingWarning } from '@/domain/accounting/types';
import type { LedgerAccount, LedgerProduct, LedgerTransaction, VaultPriceSnapshot, AgentEquitySnapshot } from '@/data/ledger/types';
import { useLedgerAccounts } from './useLedgerAccounts';
import { useLedgerProducts } from './useLedgerProducts';
import { useLedgerTransactions } from './useLedgerTransactions';
import { useLedgerSnapshots } from './useLedgerSnapshots';

export type PositionState = {
  accountId: string;
  productId: string;
  accountName: string;
  productName: string;
  productType: 'vault' | 'agent';
  sharesHeld: Decimal | null;
  latestSharePrice: Decimal | null;
  latestEquityAt: string | null;
  currentValue: Decimal | null;
  totalDeposited: Decimal;
  totalWithdrawn: Decimal;
  lifetimePnl: Decimal | null;
  withdrawableNow: Decimal | null;
  warnings: AccountingWarning[];
};

function buildVaultPosition(
  accountId: string,
  productId: string,
  accountName: string,
  productName: string,
  transactions: LedgerTransaction[],
  vaultSnapshots: VaultPriceSnapshot[],
  asOf: string,
): PositionState {
  const productTxns = transactions.filter((tx) => tx.product_id === productId && tx.account_id === accountId);
  const productSnaps = vaultSnapshots.filter((s) => s.product_id === productId);
  const state = computeVaultPosition(productTxns, productSnaps, asOf);

  const withdrawableNow = state.currentValue !== null
    ? max(D(0), state.currentValue.sub(state.totalDeposited))
    : null;

  return {
    accountId,
    productId,
    accountName,
    productName,
    productType: 'vault',
    sharesHeld: state.sharesHeld,
    latestSharePrice: state.latestSharePrice,
    latestEquityAt: null,
    currentValue: state.currentValue,
    totalDeposited: state.totalDeposited,
    totalWithdrawn: state.totalWithdrawn,
    lifetimePnl: state.lifetimePnl,
    withdrawableNow,
    warnings: state.warnings,
  };
}

function buildAgentPosition(
  accountId: string,
  productId: string,
  accountName: string,
  productName: string,
  transactions: LedgerTransaction[],
  agentSnapshots: AgentEquitySnapshot[],
  asOf: string,
): PositionState {
  const productTxns = transactions.filter((tx) => tx.product_id === productId && tx.account_id === accountId);
  const productSnaps = agentSnapshots.filter((s) => s.product_id === productId && s.account_id === accountId);
  const state = computeAgentPosition(productTxns, productSnaps, asOf);

  const withdrawableNow = state.currentValue !== null
    ? max(D(0), state.currentValue.sub(state.totalDeposited))
    : null;

  return {
    accountId,
    productId,
    accountName,
    productName,
    productType: 'agent',
    sharesHeld: null,
    latestSharePrice: null,
    latestEquityAt: state.latestEquityAt,
    currentValue: state.currentValue,
    totalDeposited: state.totalDeposited,
    totalWithdrawn: state.totalWithdrawn,
    lifetimePnl: state.lifetimePnl,
    withdrawableNow,
    warnings: state.warnings,
  };
}

function buildPositions(
  accounts: LedgerAccount[],
  products: LedgerProduct[],
  transactions: LedgerTransaction[],
  vaultSnapshots: VaultPriceSnapshot[],
  agentSnapshots: AgentEquitySnapshot[],
  asOf: string,
): PositionState[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const pairs = new Map<string, { accountId: string; productId: string }>();
  for (const tx of transactions) {
    const key = `${tx.account_id}:${tx.product_id}`;
    if (!pairs.has(key)) {
      pairs.set(key, { accountId: tx.account_id, productId: tx.product_id });
    }
  }

  const result: PositionState[] = [];
  for (const { accountId, productId } of pairs.values()) {
    const account = accountMap.get(accountId);
    const product = products.find((p) => p.id === productId);
    if (!account || !product) continue;

    if (product.product_type === 'vault') {
      result.push(buildVaultPosition(accountId, productId, account.name, product.name, transactions, vaultSnapshots, asOf));
    } else {
      result.push(buildAgentPosition(accountId, productId, account.name, product.name, transactions, agentSnapshots, asOf));
    }
  }

  return result;
}

export function useLedgerPositions(asOf?: string) {
  const resolvedAsOf = asOf ?? new Date().toISOString();

  const { data: accounts = [] } = useLedgerAccounts();
  const { data: products = [] } = useLedgerProducts();
  const { data: transactions = [] } = useLedgerTransactions();
  const { data: snapshots } = useLedgerSnapshots();

  const vaultSnapshots = snapshots?.vault ?? [];
  const agentSnapshots = snapshots?.agent ?? [];

  const positions = useMemo(
    () => buildPositions(accounts, products, transactions, vaultSnapshots, agentSnapshots, resolvedAsOf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accounts, products, transactions, vaultSnapshots, agentSnapshots, resolvedAsOf],
  );

  return positions;
}
