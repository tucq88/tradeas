# ledger-csv-import-export — ledger CSV import + export

**Epic**: ledger · **Phase**: 3 · **Severity**: 🟠 · **Depends on**: ledger-manual-forms, ledger-portfolio-positions-ui, ledger-csv-shared-refactor

## Goal

Add CSV import and export for ledger transactions, vault price snapshots, and agent equity snapshots, reusing the shared `src/lib/csv/` module. Lets the user migrate from spreadsheets while keeping the app's event ledger as the source of truth.

## Acceptance criteria

- [ ] `Imports` sub-view shows three import targets: `Transactions`, `Vault prices`, `Agent equity`
- [ ] Each target accepts a CSV (paste textarea + file upload), shows a preview via the shared `<ImportPreviewModal />`, and writes via the existing data-layer CRUD on confirm
- [ ] Required columns:
  - Transactions: `date, account, product, product_type, kind, usdc_amount`
  - Vault prices: `date, product, share_price`
  - Agent equity: `date, account, product, equity`
- [ ] Optional columns accepted: `notes, source_ref, venue, shares, share_price` (where applicable)
- [ ] Account / product names are normalized to IDs **during preview** (not after insert); unknown name → invalid row with actionable error (`Unknown account: "Foo"`)
- [ ] Invalid rows do not block valid rows by default (`partial` mode); user can switch to `all-or-nothing`
- [ ] Each successful import creates a row in `ledger_import_batches` with `source_filename`, `row_count`, `success_count`, `error_count`; imported rows reference `import_batch_id`
- [ ] Likely-duplicate rows (match on `account, product, kind, date, usdc_amount`) are flagged in preview but not blocked — user decides
- [ ] Export endpoints/handlers (or in-app download buttons) for: raw transactions, vault prices, agent equity, positions snapshot, weekly review snapshot, profit bank snapshot
- [ ] Exports include both stable IDs and display labels (`account_id`, `account_name`, `product_id`, `product_name`)
- [ ] Imports go through the same domain validation as forms (`src/domain/validation/ledger.ts`)
- [ ] No file > 250 lines
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green

## Files touched

**New:**
- `src/features/ledger/imports/ImportTransactions.tsx`
- `src/features/ledger/imports/ImportVaultPrices.tsx`
- `src/features/ledger/imports/ImportAgentEquity.tsx`
- `src/features/ledger/imports/ExportButtons.tsx`
- `src/domain/imports/ledgerSchemas.ts` — zod schemas + column mappings for each CSV type
- `src/domain/imports/ledgerNormalize.ts` — name → ID resolution (`resolveAccountId(name)`, `resolveProductId(name, productType)`)
- `src/domain/imports/ledgerExport.ts` — pure CSV serializers per type
- `src/features/ledger/__tests__/ImportTransactions.test.tsx` — 5-row mixed-quality fixture: valid + invalid + duplicate
- `src/domain/imports/__tests__/ledgerExport.test.ts` — round-trip preserves rows

**Edited:**
- `src/features/ledger/views/ImportsView.tsx` — replace placeholder

## Out of scope

- Google Sheets live sync
- XLSX / formula import
- API key sync (Quant Terminal / Lighter)
- Automatic duplicate deletion
- Server-side import jobs

## Implementation notes

- Reuse `<ImportPreviewModal />` from `src/lib/csv/` — do not duplicate UI.
- Name → ID resolution: load all accounts + products at preview time; resolve case-insensitively; trim whitespace. If the user has 0 accounts and the CSV references "Quant Terminal", show an error pointing to the `Transactions` form to add the account first (do not auto-create accounts from imports).
- Bulk insert: use Supabase JS `insert([row1, row2, ...])`; chunk at 500 rows to stay safely under any payload limit.
- `import_batch_id` foreign key is set on each inserted transaction / snapshot row in the same batch.
- Exports: simple in-memory serialization; trigger browser download via `Blob` + `URL.createObjectURL`. No backend.
- "Positions snapshot", "weekly review snapshot", "profit bank snapshot" exports = the current state of those views as CSV (not the underlying events). Useful for archiving a moment in time.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
yarn test imports
grep -Rn "=SUM\|=VLOOKUP\|formula" src/domain/imports src/features/ledger/imports   # expect: empty
find src/features/ledger/imports src/domain/imports -type f | xargs wc -l | awk '$1 > 250'   # expect: empty
```

Browser smoke:
- `Imports` → `Transactions` → paste a 5-row CSV (3 valid, 1 unknown account, 1 duplicate); preview shows 3 importable, 1 error, 1 duplicate-warning; confirm → 3 + 1 (user re-confirmed duplicate) imported; `Positions` and `Weekly` reflect the new rows
- `Imports` → `Vault prices` → import 2 SP rows for Golden vault; `Positions` updates SP
- Export `Transactions` → CSV downloads; re-import the exported CSV → no duplicates after the dedupe warning is dismissed
- Round-trip: import a known fixture, then export the same data; values match

Regression: spot CSV import (which now also uses `src/lib/csv/`) still works.

Final step: rename `docs/backlog/todo.ledger-csv-import-export.md` → `docs/backlog/done.ledger-csv-import-export.md`.
