// Numeric columns arrive from Supabase JS as strings — keep them as strings, feed into D() from decimal.ts

export type LedgerAccount = {
  id: string;
  created_at: string;
  name: string;
  venue: string;
};

export type LedgerAccountInput = Omit<LedgerAccount, 'id' | 'created_at'>;
export type LedgerAccountPatch = Partial<LedgerAccountInput>;

export type ProductType = 'vault' | 'agent';

export type LedgerProduct = {
  id: string;
  created_at: string;
  name: string;
  product_type: ProductType;
  share_based: boolean;
};

export type LedgerProductInput = Omit<LedgerProduct, 'id' | 'created_at'>;
export type LedgerProductPatch = Partial<LedgerProductInput>;

export type TransactionKind = 'deposit' | 'withdrawal' | 'fee' | 'transfer';

export type LedgerTransaction = {
  id: string;
  created_at: string;
  occurred_at: string;
  account_id: string;
  product_id: string;
  kind: TransactionKind;
  usdc_amount: string;
  share_price: string | null;
  shares_delta: string | null;
  import_batch_id: string | null;
  archived_at: string | null;
};

export type LedgerTransactionInput = Omit<LedgerTransaction, 'id' | 'created_at' | 'archived_at'>;
export type LedgerTransactionPatch = Partial<Omit<LedgerTransaction, 'id' | 'created_at'>>;

export type VaultPriceSnapshot = {
  id: string;
  created_at: string;
  product_id: string;
  snapshot_at: string;
  share_price: string;
  archived_at: string | null;
};

export type VaultPriceSnapshotInput = Omit<VaultPriceSnapshot, 'id' | 'created_at' | 'archived_at'>;
export type VaultPriceSnapshotPatch = Partial<Omit<VaultPriceSnapshot, 'id' | 'created_at'>>;

export type AgentEquitySnapshot = {
  id: string;
  created_at: string;
  account_id: string;
  product_id: string;
  snapshot_at: string;
  equity_usdc: string;
  archived_at: string | null;
};

export type AgentEquitySnapshotInput = Omit<AgentEquitySnapshot, 'id' | 'created_at' | 'archived_at'>;
export type AgentEquitySnapshotPatch = Partial<Omit<AgentEquitySnapshot, 'id' | 'created_at'>>;

export type LedgerImportBatch = {
  id: string;
  created_at: string;
  source: string;
  notes: string | null;
};

export type LedgerImportBatchInput = Omit<LedgerImportBatch, 'id' | 'created_at'>;
export type LedgerImportBatchPatch = Partial<LedgerImportBatchInput>;
