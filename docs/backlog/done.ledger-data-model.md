# ledger-data-model — supabase schema + data layer for ledger

**Epic**: ledger · **Phase**: 0 · **Severity**: 🔴 · **Depends on**: ledger-foundation

## Goal

Add the `0004_ledger.sql` migration introducing 6 tables (`ledger_accounts`, `ledger_products`, `ledger_transactions`, `vault_price_snapshots`, `agent_equity_snapshots`, `ledger_import_batches`) and `src/data/ledger/` modules following the existing CRUD-object pattern (`spotLots.ts` style). This gives the calculation engine an auditable event source.

## Acceptance criteria

- [ ] Migration `0004_ledger.sql` creates the 6 tables, with snake_case columns and check constraints below
- [ ] `ledger_products.product_type` check-constrained: `'vault' | 'agent'`
- [ ] `ledger_products.share_based boolean not null`; CHECK enforces `(product_type = 'vault') = share_based`
- [ ] `ledger_transactions.kind` check-constrained: `'deposit' | 'withdrawal' | 'fee' | 'transfer'`
- [ ] `ledger_transactions.usdc_amount numeric not null check (usdc_amount > 0)` — positive; direction comes from `kind`
- [ ] `ledger_transactions.share_price`, `shares_delta` are nullable; only used by vault transactions
- [ ] `ledger_transactions.import_batch_id uuid null references ledger_import_batches(id)` — null for manual rows
- [ ] `ledger_transactions`, `vault_price_snapshots`, `agent_equity_snapshots` each include `archived_at timestamptz null` (soft delete)
- [ ] `ledger_transactions.occurred_at timestamptz not null` (the user-supplied event time, distinct from `created_at`)
- [ ] Composite index `ledger_transactions(account_id, product_id, occurred_at)`; index on each snapshot table on `(product_id, snapshot_at)` and `(account_id, product_id, snapshot_at)` where applicable
- [ ] No DB trigger; no derived PnL columns
- [ ] `src/data/ledger/types.ts` exports row + Input + Patch types per table; numeric columns typed as `string` (Supabase JS marshals numerics to strings)
- [ ] `src/data/ledger/{accounts,products,transactions,snapshots,importBatches}.ts` each export a CRUD object (`list`, `create`, `update`, `remove`, plus type-specific helpers) following `src/data/spotLots.ts` shape
- [ ] `remove(id)` is a soft delete (`archived_at = now()`), not a hard `DELETE`, for `ledger_transactions` and snapshot tables
- [ ] No file > 250 lines
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] Migration `0004_ledger.sql` applied via Supabase dashboard before merging the PR

## Files touched

**New:**
- `supabase/migrations/0004_ledger.sql` — 6 tables, indexes, check constraints
- `src/data/ledger/types.ts` — row/Input/Patch TS types; numeric fields as `string`
- `src/data/ledger/accounts.ts` — CRUD
- `src/data/ledger/products.ts` — CRUD
- `src/data/ledger/transactions.ts` — CRUD + `listByProduct(productId)`, `listByAccount(accountId)`, `softDelete(id)`
- `src/data/ledger/snapshots.ts` — `vaultPriceSnapshots` + `agentEquitySnapshots` CRUD + `latestVaultPriceAtOrBefore(productId, asOf)`, `latestAgentEquityAtOrBefore(accountId, productId, asOf)` (these query Supabase; pure in-memory equivalents live in `src/domain/accounting/snapshots.ts` from a later spec)
- `src/data/ledger/importBatches.ts` — CRUD
- `src/data/__tests__/ledger.test.ts` — type smoke; numeric-as-string round-trip preserved

## Out of scope

- Forms / UI (later specs)
- CSV import (later spec)
- API sync with Quant Terminal / Lighter / Hyperliquid
- Tax-lot accounting
- `user_id` columns (single-user app, matches existing tables)
- Drizzle / Prisma — raw SQL + Supabase JS, matching existing convention

## Implementation notes

- Numeric precision: SQL `numeric` (no precision/scale) preserves arbitrary precision. Supabase JS returns these as JS strings — keep them as strings end-to-end and feed directly into `D()` from `src/lib/decimal.ts`. **Do not** `Number(row.usdc_amount)` anywhere in the ledger code path.
- Naming: tables and columns are snake_case; TS types in `src/data/ledger/types.ts` map to camelCase (mirrors `SpotLot`/`SpotLotInput` style — explicit field renames in the type, not auto-conversion).
- `ledger_accounts` is intentionally generic: `name text not null`, `venue text not null` (free-text for MVP — `'quant-terminal'`, `'lighter'`, etc.). Don't add a `venue` enum yet — that pre-empts the future `src/domain/account/` abstraction.
- Soft delete (`archived_at`) over hard delete: ledger rows are events; deletion would corrupt history. CRUD `remove` should set `archived_at = now()`, not `DELETE`. `list` filters out archived rows by default; add `listIncludingArchived()` only if a later spec needs it.
- Snapshot lookup helpers live in two places by design: `src/data/ledger/snapshots.ts` queries Supabase (used by hooks); `src/domain/accounting/snapshots.ts` (added later) operates on an in-memory list (used by deterministic accounting). Same algorithm, different inputs.
- Foreign keys: `ledger_products.account_id` → no, products are venue-level not account-level; instead `ledger_transactions.account_id` and `ledger_transactions.product_id` are independent FKs. A position is identified by the pair `(account_id, product_id)`.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -Rn "trigger\|CREATE TRIGGER\|lifetime_pnl\|weekly_pnl" supabase/migrations/0004_ledger.sql   # expect: empty
grep -Rn "Number(" src/data/ledger   # expect: empty
grep -Rn "from ['\"]react" src/data/ledger   # expect: empty
find supabase/migrations/0004_ledger.sql src/data/ledger -type f | xargs wc -l | awk '$1 > 250'   # expect: empty
```

Manual DB check (Supabase dashboard SQL editor):
- Insert one vault product (Golden), one agent product (XAU); insert a deposit transaction for each; insert one vault price snapshot and one agent equity snapshot
- `SELECT * FROM ledger_transactions` returns rows; `usdc_amount` arrives in the JS client as a string
- `softDelete` sets `archived_at`; subsequent `list()` no longer returns the row

Regression: `spot_lots`, `perp_positions` schema unchanged; existing panels load.

Final step: rename `docs/backlog/todo.ledger-data-model.md` → `docs/backlog/done.ledger-data-model.md`.
