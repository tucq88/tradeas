import { useQuery } from '@tanstack/react-query';
import { ledgerProducts } from '@/data/ledger/products';

export function useLedgerProducts() {
  return useQuery({ queryKey: ['ledger', 'products'], queryFn: () => ledgerProducts.list() });
}
