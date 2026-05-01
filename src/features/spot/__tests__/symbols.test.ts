import { describe, it, expect } from 'vitest';
import { toBinancePair, fromBinancePair } from '@/lib/symbols';

describe('toBinancePair', () => {
  it('converts BTC to BTCUSDT', () => {
    expect(toBinancePair('BTC')).toBe('BTCUSDT');
  });

  it('normalizes lowercase input', () => {
    expect(toBinancePair('btc')).toBe('BTCUSDT');
  });

  it('normalizes mixed case', () => {
    expect(toBinancePair('Eth')).toBe('ETHUSDT');
  });

  it('throws on empty string', () => {
    expect(() => toBinancePair('')).toThrow();
  });

  it('throws on whitespace-only string', () => {
    expect(() => toBinancePair('   ')).toThrow();
  });

  it('throws on non-alphanumeric input', () => {
    expect(() => toBinancePair('BTC/USDT')).toThrow();
    expect(() => toBinancePair('BTC USDT')).toThrow();
    expect(() => toBinancePair('BTC-USDT')).toThrow();
  });
});

describe('fromBinancePair', () => {
  it('converts BTCUSDT to BTC', () => {
    expect(fromBinancePair('BTCUSDT')).toBe('BTC');
  });

  it('converts ETHUSDT to ETH', () => {
    expect(fromBinancePair('ETHUSDT')).toBe('ETH');
  });

  it('throws when pair does not end with USDT', () => {
    expect(() => fromBinancePair('BTCBUSD')).toThrow();
    expect(() => fromBinancePair('BTC')).toThrow();
    expect(() => fromBinancePair('')).toThrow();
  });

  it('roundtrips with toBinancePair', () => {
    expect(fromBinancePair(toBinancePair('SOL'))).toBe('SOL');
  });
});
