import { describe, it, expect } from 'vitest';
import { D, add, sub, mul, div, max, min, gt, gte, eq, toFixed, toNumber } from '@/lib/decimal';

describe('decimal helpers', () => {
  it('0.1 + 0.2 === 0.3', () => {
    expect(D('0.1').add('0.2').eq('0.3')).toBe(true);
  });

  it('toFixed preserves precision', () => {
    expect(toFixed('1.123456789012', 12)).toBe('1.123456789012');
  });

  it('add / sub / mul / div', () => {
    expect(add('1', '2').toNumber()).toBe(3);
    expect(sub('5', '3').toNumber()).toBe(2);
    expect(mul('3', '4').toNumber()).toBe(12);
    expect(div('10', '4').toNumber()).toBe(2.5);
  });

  it('max / min', () => {
    expect(max('1', '3', '2').toNumber()).toBe(3);
    expect(min('1', '3', '2').toNumber()).toBe(1);
  });

  it('gt / gte / eq', () => {
    expect(gt('5', '3')).toBe(true);
    expect(gt('3', '5')).toBe(false);
    expect(gte('3', '3')).toBe(true);
    expect(eq('1.0', '1')).toBe(true);
  });

  it('toNumber round-trip', () => {
    expect(toNumber('42.5')).toBe(42.5);
  });
});
