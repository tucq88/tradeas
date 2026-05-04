import { useQuery } from '@tanstack/react-query';
import { vaultPriceSnapshots, agentEquitySnapshots } from '@/data/ledger/snapshots';

export function useLedgerSnapshots() {
  return useQuery({
    queryKey: ['ledger', 'snapshots'],
    queryFn: async () => {
      const [vault, agent] = await Promise.all([
        vaultPriceSnapshots.list(),
        agentEquitySnapshots.list(),
      ]);
      return { vault, agent };
    },
  });
}
