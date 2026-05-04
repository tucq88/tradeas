import { useQuery } from '@tanstack/react-query';
import { ledgerAccounts } from '@/data/ledger/accounts';

export function useLedgerAccounts() {
  return useQuery({ queryKey: ['ledger', 'accounts'], queryFn: () => ledgerAccounts.list() });
}
