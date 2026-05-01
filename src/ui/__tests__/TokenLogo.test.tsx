import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TokenLogo } from '@/ui/TokenLogo';

describe('TokenLogo', () => {
  it('renders an img with correct src and alt', () => {
    render(<TokenLogo symbol="BTC" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'BTC');
    expect(img).toHaveAttribute('src', 'https://assets.coincap.io/assets/icons/btc@2x.png');
  });

  it('shows letter-circle fallback on image error', () => {
    render(<TokenLogo symbol="BTC" />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('B')).toBeDefined();
  });
});
