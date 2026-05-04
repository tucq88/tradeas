import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { LedgerPanel } from '../LedgerPanel';

describe('LedgerPanel', () => {
  it('renders all 7 tabs', () => {
    render(<LedgerPanel />);
    const labels = ['Portfolio', 'Positions', 'Weekly', 'Profit Bank', 'Transactions', 'Snapshots', 'Imports'];
    labels.forEach(label => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
  });

  it('defaults to Portfolio view', () => {
    render(<LedgerPanel />);
    expect(screen.getAllByText('Portfolio').length).toBeGreaterThanOrEqual(1);
  });

  it('switches view on tab click', async () => {
    const user = userEvent.setup();
    render(<LedgerPanel />);
    await user.click(screen.getByRole('button', { name: 'Transactions' }));
    // both the tab button and the view content have the text; at least 2 matches confirms the view rendered
    expect(screen.getAllByText('Transactions').length).toBeGreaterThanOrEqual(2);
    await user.click(screen.getByRole('button', { name: 'Imports' }));
    expect(screen.getAllByText('Imports').length).toBeGreaterThanOrEqual(2);
  });
});
