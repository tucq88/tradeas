import { describe, it, expect } from 'vitest';
import { parseCsv, serializeLots } from '../csv';
import type { SpotLotInput } from '@/data/types';

const HEADER = 'asset,date,amount,entry_price,cost_usd,status,exit_price,exit_date';

describe('parseCsv', () => {
  it('parses a simple wip row', () => {
    const csv = [HEADER, 'BTC,2024-01-01,0.1,50000,5000,wip,,'].join('\n');
    const { valid, errors } = parseCsv(csv);
    expect(errors).toHaveLength(0);
    expect(valid).toHaveLength(1);
    expect(valid[0]).toMatchObject({
      asset: 'BTC', date: '2024-01-01', amount: 0.1, entry_price: 50000,
      cost_usd: 5000, status: 'wip', exit_price: null, exit_date: null,
    });
  });

  it('parses a done row', () => {
    const csv = [HEADER, 'ETH,2024-02-01,1,3000,3000,done,3500,2024-06-01'].join('\n');
    const { valid, errors } = parseCsv(csv);
    expect(errors).toHaveLength(0);
    expect(valid[0]).toMatchObject({
      asset: 'ETH', status: 'done', exit_price: 3500, exit_date: '2024-06-01',
    });
  });

  it('uppercases asset', () => {
    const csv = [HEADER, 'btc,2024-01-01,0.1,50000,5000,wip,,'].join('\n');
    const { valid } = parseCsv(csv);
    expect(valid[0].asset).toBe('BTC');
  });

  it('normalizes MM/DD/YYYY date', () => {
    const csv = [HEADER, 'BTC,01/15/2024,0.1,50000,5000,wip,,'].join('\n');
    const { valid } = parseCsv(csv);
    expect(valid[0].date).toBe('2024-01-15');
  });

  it('strips UTF-8 BOM', () => {
    const csv = '﻿' + HEADER + '\nBTC,2024-01-01,0.1,50000,5000,wip,,';
    const { valid, errors } = parseCsv(csv);
    expect(errors).toHaveLength(0);
    expect(valid).toHaveLength(1);
  });

  it('skips blank lines silently', () => {
    const csv = [HEADER, '', 'BTC,2024-01-01,0.1,50000,5000,wip,,', ''].join('\n');
    const { valid, errors } = parseCsv(csv);
    expect(errors).toHaveLength(0);
    expect(valid).toHaveLength(1);
  });

  it('handles CRLF line endings', () => {
    const csv = [HEADER, 'BTC,2024-01-01,0.1,50000,5000,wip,,'].join('\r\n');
    const { valid } = parseCsv(csv);
    expect(valid).toHaveLength(1);
  });

  it('ignores extra columns', () => {
    const csv = [
      HEADER + ',extra_col',
      'BTC,2024-01-01,0.1,50000,5000,wip,,,ignored',
    ].join('\n');
    const { valid, errors } = parseCsv(csv);
    expect(errors).toHaveLength(0);
    expect(valid).toHaveLength(1);
  });

  it('handles quoted fields with commas', () => {
    const csv = [HEADER, '"BTC",2024-01-01,0.1,50000,5000,wip,,'].join('\n');
    const { valid } = parseCsv(csv);
    expect(valid[0].asset).toBe('BTC');
  });

  it('returns error for missing required column', () => {
    const csv = 'asset,date,amount,entry_price,cost_usd\nBTC,2024-01-01,0.1,50000,5000';
    const { valid, errors } = parseCsv(csv);
    expect(valid).toHaveLength(0);
    expect(errors[0]).toMatch(/missing required column: status/);
  });

  it('collects row-level errors and skips invalid rows', () => {
    const csv = [
      HEADER,
      'BTC,2024-01-01,0.1,50000,5000,wip,,',  // valid
      ',2024-01-01,0.1,50000,5000,wip,,',       // empty asset
      'ETH,bad-date,1,3000,3000,wip,,',         // bad date
    ].join('\n');
    const { valid, errors } = parseCsv(csv);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(2);
  });

  it('errors when wip row has exit_price', () => {
    const csv = [HEADER, 'BTC,2024-01-01,0.1,50000,5000,wip,100,'].join('\n');
    const { valid, errors } = parseCsv(csv);
    expect(valid).toHaveLength(0);
    expect(errors[0]).toMatch(/exit_price must be empty for wip/);
  });

  it('errors when done row has no exit_price', () => {
    const csv = [HEADER, 'BTC,2024-01-01,0.1,50000,5000,done,,2024-06-01'].join('\n');
    const { errors } = parseCsv(csv);
    expect(errors[0]).toMatch(/invalid exit_price for done/);
  });

  it('returns error for empty file', () => {
    const { valid, errors } = parseCsv('   \n  ');
    expect(valid).toHaveLength(0);
    expect(errors[0]).toMatch(/empty/);
  });

  it('is case-insensitive for status', () => {
    const csv = [HEADER, 'BTC,2024-01-01,0.1,50000,5000,WIP,,'].join('\n');
    const { valid } = parseCsv(csv);
    expect(valid[0].status).toBe('wip');
  });
});

describe('serializeLots', () => {
  const wip: SpotLotInput = {
    asset: 'BTC', date: '2024-01-01', amount: 0.1, entry_price: 50000,
    cost_usd: 5000, status: 'wip', exit_price: null, exit_date: null,
  };
  const done: SpotLotInput = {
    asset: 'ETH', date: '2024-02-01', amount: 1, entry_price: 3000,
    cost_usd: 3000, status: 'done', exit_price: 3500, exit_date: '2024-06-01',
  };

  it('emits canonical header', () => {
    const out = serializeLots([wip]);
    expect(out.split('\n')[0]).toBe('asset,date,amount,entry_price,cost_usd,status,exit_price,exit_date');
  });

  it('serializes wip row with empty exit fields', () => {
    const lines = serializeLots([wip]).split('\n');
    expect(lines[1]).toBe('BTC,2024-01-01,0.1,50000,5000,wip,,');
  });

  it('serializes done row with exit fields', () => {
    const lines = serializeLots([done]).split('\n');
    expect(lines[1]).toBe('ETH,2024-02-01,1,3000,3000,done,3500,2024-06-01');
  });

  it('round-trips: serialize then parse yields same data', () => {
    const lots = [wip, done];
    const csv = serializeLots(lots);
    const { valid, errors } = parseCsv(csv);
    expect(errors).toHaveLength(0);
    expect(valid).toHaveLength(2);
    expect(valid[0]).toMatchObject({ asset: 'BTC', amount: 0.1, status: 'wip', exit_price: null });
    expect(valid[1]).toMatchObject({ asset: 'ETH', status: 'done', exit_price: 3500 });
  });

  it('does not use toLocaleString for numbers', () => {
    const lot: SpotLotInput = { ...wip, amount: 1234567.89, entry_price: 1234567, cost_usd: 1234567 };
    const csv = serializeLots([lot]);
    expect(csv).not.toContain('1,234,567');
    expect(csv).toContain('1234567');
  });
});
