import { z } from 'zod';

const positiveNumStr = z.string().refine(
  (s) => s !== '' && !isNaN(parseFloat(s)) && parseFloat(s) > 0,
  { message: 'must be a positive number' },
);

const nonNegNumStr = z.string().refine(
  (s) => s !== '' && !isNaN(parseFloat(s)) && parseFloat(s) >= 0,
  { message: 'must be non-negative' },
);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

export const accountSchema = z.object({
  name: z.string().min(1, 'required'),
  venue: z.string().min(1, 'required'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'required'),
  product_type: z.enum(['vault', 'agent'] as const),
  share_based: z.boolean(),
});

export const transactionSchema = z.object({
  occurred_at: isoDate,
  account_id: z.string().min(1, 'required'),
  product_id: z.string().min(1, 'required'),
  kind: z.enum(['deposit', 'withdrawal', 'fee', 'transfer'] as const),
  usdc_amount: positiveNumStr,
  share_price: z.string().optional(),
  shares_delta: z.string().optional(),
});

export const vaultSnapshotSchema = z.object({
  product_id: z.string().min(1, 'required'),
  snapshot_at: isoDate,
  share_price: positiveNumStr,
});

export const agentSnapshotSchema = z.object({
  product_id: z.string().min(1, 'required'),
  account_id: z.string().min(1, 'required'),
  snapshot_at: isoDate,
  equity_usdc: nonNegNumStr,
});

export type AccountFormValues = z.infer<typeof accountSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type VaultSnapshotFormValues = z.infer<typeof vaultSnapshotSchema>;
export type AgentSnapshotFormValues = z.infer<typeof agentSnapshotSchema>;
