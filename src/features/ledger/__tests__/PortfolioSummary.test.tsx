import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PortfolioSummary } from '../portfolio/PortfolioSummary';
import type { PositionState } from '@/data/hooks/useLedgerPositions';
import { D } from '@/lib/decimal';

function makePosition(overrides: Partial<PositionState>): PositionState {
  return {
    accountId: 'acc-1',
    productId: 'prod-1',
    accountName: 'Test Account',
    productName: 'Test Product',
    productType: 'vault',
    sharesHeld: D(0),
    latestSharePrice: null,
    latestEquityAt: null,
    currentValue: null,
    totalDeposited: D(0),
    totalWithdrawn: D(0),
    lifetimePnl: null,
    withdrawableNow: null,
    warnings: [],
    ...overrides,
  };
}

// deposit 4000 @ SP 1.00 → 4000 shares
// withdrawal 500 @ SP 1.46 → 342.4658 burned, remaining 3657.5342 shares
// current value at SP 1.46 = 3657.5342 * 1.46 ≈ 5339.99, simplified to 5340
// lifetimePnl = 5340 + 500 - 4000 = 1840
// withdrawableNow = max(0, 5340 - 4000) = 1340

const GOLDEN_VAULT: PositionState = makePosition({
  productType: 'vault',
  sharesHeld: D('3657.534247'),
  latestSharePrice: D('1.46'),
  currentValue: D('5340.00'),
  totalDeposited: D('4000.00'),
  totalWithdrawn: D('500.00'),
  lifetimePnl: D('1840.00'),
  withdrawableNow: D('1340.00'),
});

describe('PortfolioSummary — single vault position', () => {
  it('shows total exposure', () => {
    render(<PortfolioSummary positions={[GOLDEN_VAULT]} />);
    expect(screen.getByText('$5340.00')).toBeInTheDocument();
  });

  it('shows total deposited', () => {
    render(<PortfolioSummary positions={[GOLDEN_VAULT]} />);
    expect(screen.getByText('$4000.00')).toBeInTheDocument();
  });

  it('shows lifetime PnL', () => {
    render(<PortfolioSummary positions={[GOLDEN_VAULT]} />);
    expect(screen.getByText('$1840.00')).toBeInTheDocument();
  });

  it('shows cash recovered %', () => {
    render(<PortfolioSummary positions={[GOLDEN_VAULT]} />);
    expect(screen.getByText('12.50%')).toBeInTheDocument();
  });

  it('shows house money count', () => {
    render(<PortfolioSummary positions={[GOLDEN_VAULT]} />);
    expect(screen.getByText('0 pos')).toBeInTheDocument();
  });
});

describe('PortfolioSummary — aggregation across positions', () => {
  const pos2: PositionState = makePosition({
    accountId: 'acc-2',
    productId: 'prod-2',
    productType: 'agent',
    currentValue: D('1000.00'),
    totalDeposited: D('800.00'),
    totalWithdrawn: D('0'),
    lifetimePnl: D('200.00'),
    withdrawableNow: D('200.00'),
  });

  it('sums exposures from both positions', () => {
    render(<PortfolioSummary positions={[GOLDEN_VAULT, pos2]} />);
    expect(screen.getByText('$6340.00')).toBeInTheDocument();
  });

  it('sums deposited from both positions', () => {
    render(<PortfolioSummary positions={[GOLDEN_VAULT, pos2]} />);
    expect(screen.getByText('$4800.00')).toBeInTheDocument();
  });
});

describe('PortfolioSummary — empty positions', () => {
  it('shows dashes for null aggregate values', () => {
    const noValue = makePosition({ currentValue: null, lifetimePnl: null, withdrawableNow: null });
    render(<PortfolioSummary positions={[noValue]} />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });
});
