import { useLedgerPositions } from '@/data/hooks/useLedgerPositions';
import { PortfolioSummary } from '../portfolio/PortfolioSummary';

export function PortfolioView() {
  const positions = useLedgerPositions();

  return (
    <div className="p-6">
      <PortfolioSummary positions={positions} />
      {positions.length === 0 && (
        <p className="text-fg-3 text-[13px]">no positions — add transactions in the Transactions tab</p>
      )}
    </div>
  );
}
