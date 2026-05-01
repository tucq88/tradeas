export const PALETTE = [
  'var(--alloc-1)', 'var(--alloc-2)', 'var(--alloc-3)', 'var(--alloc-4)',
  'var(--alloc-5)', 'var(--alloc-6)', 'var(--alloc-7)', 'var(--alloc-8)',
] as const;

export function assignColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
