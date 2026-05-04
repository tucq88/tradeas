import { useState } from 'react';
import { PortfolioView } from './views/PortfolioView';
import { PositionsView } from './views/PositionsView';
import { WeeklyView } from './views/WeeklyView';
import { ProfitBankView } from './views/ProfitBankView';
import { TransactionsView } from './views/TransactionsView';
import { SnapshotsView } from './views/SnapshotsView';
import { ImportsView } from './views/ImportsView';

type TabId = 'portfolio' | 'positions' | 'weekly' | 'profit-bank' | 'transactions' | 'snapshots' | 'imports';

const TABS: { id: TabId; label: string }[] = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'positions', label: 'Positions' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'profit-bank', label: 'Profit Bank' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'snapshots', label: 'Snapshots' },
  { id: 'imports', label: 'Imports' },
];

function TabView({ tab, onNavigate }: { tab: TabId; onNavigate: (t: TabId) => void }) {
  switch (tab) {
    case 'portfolio': return <PortfolioView />;
    case 'positions': return <PositionsView onNavigate={(t) => onNavigate(t as TabId)} />;
    case 'weekly': return <WeeklyView />;
    case 'profit-bank': return <ProfitBankView />;
    case 'transactions': return <TransactionsView />;
    case 'snapshots': return <SnapshotsView />;
    case 'imports': return <ImportsView />;
  }
}

export function LedgerPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('portfolio');

  return (
    <div className="w-full">
      <nav className="flex gap-1 border-b border-border-1 mb-4">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={[
              'px-3 py-2 text-sm leading-none rounded-t-sm transition-colors',
              activeTab === id
                ? 'text-fg-1 border-b-2 border-accent -mb-px'
                : 'text-fg-3 hover:text-fg-1 hover:bg-bg-inset',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </nav>
      <TabView tab={activeTab} onNavigate={setActiveTab} />
    </div>
  );
}
