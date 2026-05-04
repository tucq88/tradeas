import { useState } from 'react';
import { useLedgerPositions } from '@/data/hooks/useLedgerPositions';
import { useLedgerAccounts } from '@/data/hooks/useLedgerAccounts';
import { PositionsTable } from '../positions/PositionsTable';
import { PositionFilters, applyPositionFilters } from '../positions/PositionFilters';
import type { ProductTypeFilter } from '../positions/PositionFilters';

type Props = {
  onNavigate?: (tab: string) => void;
};

export function PositionsView({ onNavigate }: Props) {
  const positions = useLedgerPositions();
  const { data: accounts = [] } = useLedgerAccounts();
  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>('all');

  const filtered = applyPositionFilters(positions, accountFilter, typeFilter);

  function handleAddSnapshot(productId: string) {
    void productId;
    onNavigate?.('snapshots');
  }

  return (
    <div className="p-6">
      <PositionFilters
        accounts={accounts}
        accountFilter={accountFilter}
        typeFilter={typeFilter}
        onAccountChange={setAccountFilter}
        onTypeChange={setTypeFilter}
      />
      <PositionsTable positions={filtered} onAddSnapshot={handleAddSnapshot} />
    </div>
  );
}
