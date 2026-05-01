import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from '@/ui/Slider';

describe('Slider', () => {
  it('renders with value 10 — slider and badge both show 10', () => {
    render(<Slider value={10} onChange={() => {}} />);
    const range = screen.getByRole('slider') as HTMLInputElement;
    expect(range.value).toBe('10');
    const badge = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(badge.value).toBe('10');
  });

  it('changing slider fires onChange with new numeric value', () => {
    const onChange = vi.fn();
    render(<Slider value={10} onChange={onChange} />);
    const range = screen.getByRole('slider');
    fireEvent.change(range, { target: { value: '25' } });
    expect(onChange).toHaveBeenCalledWith(25);
  });
});
