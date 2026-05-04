import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PositionsTable } from '../positions/PositionsTable';
import { PositionStatusBadge, resolveStatus } from '../positions/PositionStatusBadge';
import type { PositionState } from '@/data/hooks/useLedgerPositions';
import { D } from '@/lib/decimal';

function makePosition(overrides: Partial<PositionState>): PositionState {
  return {
    accountId: 'acc-1',
    productId: 'prod-1',
    accountName: 'My Account',
    productName: 'Golden Vault',
    productType: 'vault',
    sharesHeld: D('3657.534247'),
    latestSharePrice: D('1.46'),
    latestEquityAt: null,
    currentValue: D('5340.00'),
    totalDeposited: D('4000.00'),
    totalWithdrawn: D('500.00'),
    lifetimePnl: D('1840.00'),
    withdrawableNow: D('1340.00'),
    warnings: [],
    ...overrides,
  };
}

const GOLDEN_VAULT = makePosition({});

const AGENT_POS = makePosition({
  accountId: 'acc-2',
  productId: 'prod-agent',
  accountName: 'XAU Account',
  productName: 'XAU Agent',
  productType: 'agent',
  sharesHeld: null,
  latestSharePrice: null,
  latestEquityAt: '2024-05-01T00:00:00Z',
  currentValue: D('2000.00'),
  totalDeposited: D('1500.00'),
  totalWithdrawn: D('0'),
  lifetimePnl: D('500.00'),
  withdrawableNow: D('500.00'),
});

describe('PositionsTable — vault position row', () => {
  it('renders account and product names', () => {
    render(<PositionsTable positions={[GOLDEN_VAULT]} />);
    expect(screen.getByText('My Account')).toBeInTheDocument();
    expect(screen.getByText('Golden Vault')).toBeInTheDocument();
  });

  it('renders shares with 6 decimal places', () => {
    render(<PositionsTable positions={[GOLDEN_VAULT]} />);
    expect(screen.getByText('3657.534247')).toBeInTheDocument();
  });

  it('renders current value', () => {
    render(<PositionsTable positions={[GOLDEN_VAULT]} />);
    expect(screen.getByText('5340.00')).toBeInTheDocument();
  });

  it('renders lifetime PnL', () => {
    render(<PositionsTable positions={[GOLDEN_VAULT]} />);
    expect(screen.getByText('1840.00')).toBeInTheDocument();
  });
});

describe('PositionsTable — agent position row', () => {
  it('renders — for shares on agent position', () => {
    render(<PositionsTable positions={[AGENT_POS]} />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('renders agent current value', () => {
    render(<PositionsTable positions={[AGENT_POS]} />);
    expect(screen.getAllByText('2000.00').length).toBeGreaterThanOrEqual(1);
  });
});

describe('PositionsTable — missing snapshot shows add link', () => {
  it('renders → add snapshot link for missing snapshot rows', async () => {
    const missingPos = makePosition({
      currentValue: null,
      lifetimePnl: null,
      withdrawableNow: null,
      warnings: [{ kind: 'missing_snapshot' }],
    });
    const onAddSnapshot = vi.fn();
    render(<PositionsTable positions={[missingPos]} onAddSnapshot={onAddSnapshot} />);
    const link = screen.getByRole('button', { name: '→ add snapshot' });
    expect(link).toBeInTheDocument();
    await userEvent.click(link);
    expect(onAddSnapshot).toHaveBeenCalledWith('prod-1');
  });
});

describe('PositionsTable — empty state', () => {
  it('shows empty message when no positions', () => {
    render(<PositionsTable positions={[]} />);
    expect(screen.getByText(/no positions/i)).toBeInTheDocument();
  });
});

describe('PositionStatusBadge — status mapping', () => {
  it('tp available: withdrawable > 0 and totalWithdrawn < totalDeposited', () => {
    const pos = makePosition({ withdrawableNow: D('100'), warnings: [] });
    expect(resolveStatus(pos)).toBe('tp available');
  });

  it('missing snapshot: has missing_snapshot warning', () => {
    const pos = makePosition({ warnings: [{ kind: 'missing_snapshot' }], currentValue: null });
    expect(resolveStatus(pos)).toBe('missing snapshot');
  });

  it('stale snapshot: has stale_snapshot warning', () => {
    const pos = makePosition({
      warnings: [{ kind: 'stale_snapshot', snapshotAt: '2024-01-01T00:00:00Z', asOf: '2024-01-10T00:00:00Z' }],
    });
    expect(resolveStatus(pos)).toBe('stale snapshot');
  });

  it('house money: totalWithdrawn >= totalDeposited', () => {
    const pos = makePosition({
      totalWithdrawn: D('4000'),
      totalDeposited: D('4000'),
      warnings: [],
    });
    expect(resolveStatus(pos)).toBe('house money');
  });

  it('below principal floor: currentValue < totalDeposited', () => {
    const pos = makePosition({
      currentValue: D('3000'),
      totalDeposited: D('4000'),
      withdrawableNow: D('0'),
      warnings: [],
    });
    expect(resolveStatus(pos)).toBe('below principal floor');
  });

  it('renders badge without error', () => {
    render(<PositionStatusBadge position={GOLDEN_VAULT} />);
    expect(screen.getByText('tp available')).toBeInTheDocument();
  });
});
