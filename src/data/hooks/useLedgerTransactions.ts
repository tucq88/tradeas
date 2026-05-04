import { useQuery } from '@tanstack/react-query';
import { ledgerTransactions } from '@/data/ledger/transactions';

export function useLedgerTransactions() {
  return useQuery({ queryKey: ['ledger', 'transactions'], queryFn: () => ledgerTransactions.list() });
}
