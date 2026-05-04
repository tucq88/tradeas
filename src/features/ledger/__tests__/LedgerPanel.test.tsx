import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LedgerPanel } from '../LedgerPanel';

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('LedgerPanel', () => {
  it('renders all 7 tabs', () => {
    wrap(<LedgerPanel />);
    const labels = ['Portfolio', 'Positions', 'Weekly', 'Profit Bank', 'Transactions', 'Snapshots', 'Imports'];
    labels.forEach(label => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
  });

  it('defaults to Portfolio view', () => {
    wrap(<LedgerPanel />);
    expect(screen.getAllByText('Portfolio').length).toBeGreaterThanOrEqual(1);
  });

  it('switches view on tab click', async () => {
    const user = userEvent.setup();
    wrap(<LedgerPanel />);
    await user.click(screen.getByRole('button', { name: 'Transactions' }));
    expect(screen.getAllByText('add transaction').length).toBeGreaterThanOrEqual(1);
    await user.click(screen.getByRole('button', { name: 'Imports' }));
    expect(screen.getAllByText('Imports').length).toBeGreaterThanOrEqual(2);
  });
});
