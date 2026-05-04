import { useState } from 'react';
import { Scratchpad } from '@/features/scratchpad/Scratchpad';
import { SettingsDrawer } from '@/features/settings/SettingsDrawer';
import { PerpPanel } from '@/features/perp/PerpPanel';
import { SpotPanel } from '@/features/spot/SpotPanel';
import { AllocationPanel } from '@/features/allocation/AllocationPanel';
import { LedgerPanel } from '@/features/ledger/LedgerPanel';
import { RefreshAllButton } from '@/components/RefreshAllButton';

type Mode = 'trading' | 'ledger';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('trading');

  return (
    /* 1024px: grid stays 12-col; panels scroll internally */
    <div className="min-h-screen bg-bg-0 text-fg-1 p-6 overflow-x-hidden">
      <header className="flex items-center justify-between h-11 mb-4">
        <span
          aria-label="tradeas"
          className="font-sans font-semibold text-base leading-none tracking-tight text-fg-1"
        >
          trade<span className="text-accent">a</span>s
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode('trading')}
              className={[
                'h-7 px-2 text-xs rounded-sm transition-colors',
                mode === 'trading'
                  ? 'text-fg-1 bg-bg-inset'
                  : 'text-fg-3 hover:text-fg-1 hover:bg-bg-inset',
              ].join(' ')}
            >
              Trading
            </button>
            <button
              type="button"
              onClick={() => setMode('ledger')}
              className={[
                'h-7 px-2 text-xs rounded-sm transition-colors',
                mode === 'ledger'
                  ? 'text-fg-1 bg-bg-inset'
                  : 'text-fg-3 hover:text-fg-1 hover:bg-bg-inset',
              ].join(' ')}
            >
              Ledger
            </button>
          </div>
          <RefreshAllButton />
          <button
            type="button"
            aria-label="open settings"
            onClick={() => setSettingsOpen(true)}
            className="h-7 w-7 flex items-center justify-center rounded-sm text-fg-3 hover:text-fg-1 hover:bg-bg-inset transition-colors"
          >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          </button>
        </div>
      </header>
      {mode === 'trading' ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 row-span-3">
            <Scratchpad />
          </div>
          <div className="col-span-8">
            <PerpPanel />
          </div>
          <div className="col-span-8">
            <SpotPanel />
          </div>
          <div className="col-span-8">
            <AllocationPanel />
          </div>
        </div>
      ) : (
        <LedgerPanel />
      )}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
