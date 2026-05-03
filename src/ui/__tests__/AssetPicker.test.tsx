import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssetPicker } from '@/ui/AssetPicker';
import type { CoinListEntry } from '@/data/coingecko/coinList';

function makeCoinList(entries: Partial<CoinListEntry>[]): Map<string, CoinListEntry> {
  const map = new Map<string, CoinListEntry>();
  for (const e of entries) {
    const entry: CoinListEntry = {
      id: e.id ?? 'unknown',
      symbol: e.symbol ?? 'UNK',
      name: e.name ?? 'Unknown',
      mcap_rank: e.mcap_rank,
      image: e.image,
    };
    map.set(entry.id, entry);
  }
  return map;
}

const btc: CoinListEntry = { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', mcap_rank: 1 };
const eth: CoinListEntry = { id: 'ethereum', symbol: 'eth', name: 'Ethereum', mcap_rank: 2 };
const pepe: CoinListEntry = { id: 'pepe', symbol: 'pepe', name: 'Pepe', mcap_rank: 50 };

const coinList = makeCoinList([btc, eth, pepe]);

describe('AssetPicker', () => {
  it('shows dropdown on focus and lists coins', () => {
    render(
      <AssetPicker coinList={coinList} heldIds={[]} value={null} onChange={vi.fn()} />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByText('Bitcoin')).toBeDefined();
    expect(screen.getByText('Ethereum')).toBeDefined();
  });

  it('shows "Your assets" section for heldIds first', () => {
    render(
      <AssetPicker coinList={coinList} heldIds={['bitcoin']} value={null} onChange={vi.fn()} />,
    );
    fireEvent.focus(screen.getByRole('textbox'));
    expect(screen.getByText('Your assets')).toBeDefined();
    expect(screen.getByText('All coins')).toBeDefined();
  });

  it('calls onChange with the entry when a row is clicked', () => {
    const onChange = vi.fn();
    render(<AssetPicker coinList={coinList} heldIds={[]} value={null} onChange={onChange} />);
    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.pointerDown(screen.getByText('Bitcoin'));
    expect(onChange).toHaveBeenCalledWith(btc);
  });

  it('filters coins by query', () => {
    render(<AssetPicker coinList={coinList} heldIds={[]} value={null} onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'pe' } });
    expect(screen.getByText('Pepe')).toBeDefined();
    expect(screen.queryByText('Bitcoin')).toBeNull();
  });

  it('closes dropdown on Escape', () => {
    render(<AssetPicker coinList={coinList} heldIds={[]} value={null} onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByText('Bitcoin')).toBeDefined();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('Bitcoin')).toBeNull();
  });

  it('selects with Enter after keyboard navigation', () => {
    const onChange = vi.fn();
    render(<AssetPicker coinList={coinList} heldIds={[]} value={null} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(btc);
  });

  it('Enter inside open dropdown does not submit outer form', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <AssetPicker coinList={coinList} heldIds={[]} value={null} onChange={vi.fn()} />
      </form>,
    );
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the selected value in the input', () => {
    render(<AssetPicker coinList={coinList} heldIds={[]} value={btc} onChange={vi.fn()} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('BTC');
  });

  it('clears parent value when typing diverges from selection', () => {
    const onChange = vi.fn();
    render(<AssetPicker coinList={coinList} heldIds={[]} value={btc} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ETH' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('does not clear parent value when typing matches selection (no-op edit)', () => {
    const onChange = vi.fn();
    render(<AssetPicker coinList={coinList} heldIds={[]} value={btc} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'BTC' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
