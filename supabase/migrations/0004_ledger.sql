-- Ledger: accounts, products, transactions, snapshots, import batches

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  venue text NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('vault', 'agent')),
  share_based boolean NOT NULL,
  CONSTRAINT share_based_matches_type CHECK ((product_type = 'vault') = share_based)
);

CREATE TABLE IF NOT EXISTS ledger_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  notes text NULL
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  occurred_at timestamptz NOT NULL,
  account_id uuid NOT NULL REFERENCES ledger_accounts(id),
  product_id uuid NOT NULL REFERENCES ledger_products(id),
  kind text NOT NULL CHECK (kind IN ('deposit', 'withdrawal', 'fee', 'transfer')),
  usdc_amount numeric NOT NULL CHECK (usdc_amount > 0),
  share_price numeric NULL,
  shares_delta numeric NULL,
  import_batch_id uuid NULL REFERENCES ledger_import_batches(id),
  archived_at timestamptz NULL
);

CREATE TABLE IF NOT EXISTS vault_price_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  product_id uuid NOT NULL REFERENCES ledger_products(id),
  snapshot_at timestamptz NOT NULL,
  share_price numeric NOT NULL,
  archived_at timestamptz NULL
);

CREATE TABLE IF NOT EXISTS agent_equity_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  account_id uuid NOT NULL REFERENCES ledger_accounts(id),
  product_id uuid NOT NULL REFERENCES ledger_products(id),
  snapshot_at timestamptz NOT NULL,
  equity_usdc numeric NOT NULL,
  archived_at timestamptz NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS ledger_transactions_account_product_time_idx
  ON ledger_transactions (account_id, product_id, occurred_at);

CREATE INDEX IF NOT EXISTS vault_price_snapshots_product_time_idx
  ON vault_price_snapshots (product_id, snapshot_at);

CREATE INDEX IF NOT EXISTS agent_equity_snapshots_product_time_idx
  ON agent_equity_snapshots (product_id, snapshot_at);

CREATE INDEX IF NOT EXISTS agent_equity_snapshots_account_product_time_idx
  ON agent_equity_snapshots (account_id, product_id, snapshot_at);
