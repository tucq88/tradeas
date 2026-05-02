import type { SpotLotInput } from '@/data/types';

export const CSV_HEADER = 'asset,date,amount,entry_price,cost_usd,status,exit_price,exit_date';

// ---- serializer ----
function quoteField(v: string): string {
  return (v.includes(',') || v.includes('"') || v.includes('\n'))
    ? '"' + v.replace(/"/g, '""') + '"' : v;
}
export function serializeLots(lots: SpotLotInput[]): string {
  const rows = lots.map((l) => [
    l.asset, l.date, String(l.amount), String(l.entry_price), String(l.cost_usd), l.status,
    l.exit_price != null ? String(l.exit_price) : '',
    l.exit_date != null ? l.exit_date : '',
  ].map(quoteField).join(','));
  return [CSV_HEADER, ...rows].join('\n');
}
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ---- parser ----
export type ParseResult = { valid: SpotLotInput[]; errors: string[] };
const REQUIRED_COLS = ['asset', 'date', 'amount', 'entry_price', 'cost_usd', 'status'] as const;

function splitLine(line: string): string[] {
  const fields: string[] = [];
  let cur = ''; let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { fields.push(cur); cur = ''; }
      else { cur += ch; }
    }
  }
  fields.push(cur);
  return fields;
}

function normalizeDate(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
}

function posNum(s: string): number | null {
  const n = parseFloat(s);
  return isFinite(n) && n > 0 ? n : null;
}

export function parseCsv(raw: string): ParseResult {
  const text = raw.startsWith('﻿') ? raw.slice(1) : raw;
  const lines = text.split(/\r?\n/);
  const valid: SpotLotInput[] = [];
  const errors: string[] = [];

  let headerIdx = -1; let cols: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    cols = splitLine(lines[i]).map((c) => c.trim().toLowerCase());
    headerIdx = i; break;
  }
  if (headerIdx === -1) return { valid: [], errors: ['file is empty'] };

  for (const req of REQUIRED_COLS) {
    if (!cols.includes(req)) return { valid: [], errors: [`missing required column: ${req}`] };
  }
  const idx = (name: string) => cols.indexOf(name);

  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const r = i + 1;
    const fields = splitLine(lines[i]);
    const get = (name: string) => (fields[idx(name)] ?? '').trim();

    const asset = get('asset').toUpperCase();
    if (!asset) { errors.push(`row ${r}: asset is empty`); continue; }

    const date = normalizeDate(get('date'));
    if (!date) { errors.push(`row ${r}: invalid date "${get('date')}"`); continue; }

    const amount = posNum(get('amount'));
    if (!amount) { errors.push(`row ${r}: invalid amount`); continue; }

    const entry_price = posNum(get('entry_price'));
    if (!entry_price) { errors.push(`row ${r}: invalid entry_price`); continue; }

    const cost_usd = posNum(get('cost_usd'));
    if (!cost_usd) { errors.push(`row ${r}: invalid cost_usd`); continue; }

    const rawStatus = get('status').toLowerCase();
    if (rawStatus !== 'wip' && rawStatus !== 'done') {
      errors.push(`row ${r}: status must be "wip" or "done"`); continue;
    }
    const status = rawStatus as 'wip' | 'done';
    const rawEP = get('exit_price'); const rawED = get('exit_date');

    if (status === 'wip') {
      if (rawEP !== '') { errors.push(`row ${r}: exit_price must be empty for wip`); continue; }
      if (rawED !== '') { errors.push(`row ${r}: exit_date must be empty for wip`); continue; }
      valid.push({ asset, date, amount, entry_price, cost_usd, status, exit_price: null, exit_date: null });
    } else {
      const exit_price = posNum(rawEP);
      if (!exit_price) { errors.push(`row ${r}: invalid exit_price for done lot`); continue; }
      const exit_date = normalizeDate(rawED);
      if (!exit_date) { errors.push(`row ${r}: invalid exit_date for done lot`); continue; }
      valid.push({ asset, date, amount, entry_price, cost_usd, status, exit_price, exit_date });
    }
  }
  return { valid, errors };
}
