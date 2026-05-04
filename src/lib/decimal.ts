import Decimal from 'decimal.js';

export { Decimal };

export function D(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export const add = (a: string | number | Decimal, b: string | number | Decimal): Decimal =>
  D(a).add(D(b));

export const sub = (a: string | number | Decimal, b: string | number | Decimal): Decimal =>
  D(a).sub(D(b));

export const mul = (a: string | number | Decimal, b: string | number | Decimal): Decimal =>
  D(a).mul(D(b));

export const div = (a: string | number | Decimal, b: string | number | Decimal): Decimal =>
  D(a).div(D(b));

export const max = (...values: (string | number | Decimal)[]): Decimal =>
  Decimal.max(...values.map(D));

export const min = (...values: (string | number | Decimal)[]): Decimal =>
  Decimal.min(...values.map(D));

export const gt = (a: string | number | Decimal, b: string | number | Decimal): boolean =>
  D(a).gt(D(b));

export const gte = (a: string | number | Decimal, b: string | number | Decimal): boolean =>
  D(a).gte(D(b));

export const eq = (a: string | number | Decimal, b: string | number | Decimal): boolean =>
  D(a).eq(D(b));

export const toFixed = (value: string | number | Decimal, decimals: number): string =>
  D(value).toFixed(decimals);

export const toNumber = (value: string | number | Decimal): number =>
  D(value).toNumber();
