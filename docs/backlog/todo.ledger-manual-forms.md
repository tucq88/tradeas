# ledger-manual-forms — manual entry for transactions and snapshots

**Epic**: ledger · **Phase**: 2 · **Severity**: 🟠 · **Depends on**: ledger-weekly-review-engine

## Goal

Build manual input flows for accounts, products, deposits, withdrawals, vault share-price snapshots, and agent equity snapshots. Manual entry is the MVP path before any venue APIs exist.

## Acceptance criteria

- [ ] `Transactions` sub-view shows a list of recent ledger transactions with filters (account, product, kind) + an "Add transaction" form
- [ ] Form supports `kind`: deposit / withdrawal / fee / transfer; account picker; product picker (filtered by account or unconstrained — see notes); USDC amount; occurred-at date; optional notes
- [ ] When the selected product is a vault, the form additionally requires `sharePrice` and shows a withdrawal preview: burned shares, realized profit, principal touched, remaining shares
- [ ] Vault withdrawal can be entered as either `usdcAmount` *or* `shares`; the other is derived live and shown in the preview
- [ ] Agent transactions never ask for `sharePrice` or `shares`
- [ ] `Snapshots` sub-view shows a list of recent vault price + agent equity snapshots with filters + "Add snapshot" form
- [ ] Snapshot form: type toggle (vault price / agent equity); product picker; (account picker for agent equity); value (`sharePrice` or `equity`); snapshot-at date; `equity` validates `>= 0`
- [ ] Invalid inputs show field-level errors before submit (zod schema)
- [ ] Submit button is disabled while inputs are invalid
- [ ] Adding a transaction or snapshot invalidates the relevant TanStack Query keys; `Portfolio` / `Positions` / `Weekly` views reflect the change without a manual refresh
- [ ] No form performs accounting differently from `src/domain/accounting/` — withdrawal preview calls `classifyWithdrawal` directly
- [ ] No `style={{` in any new file; all styling via Tailwind utilities
- [ ] No new file > 250 lines

## Files touched

**New:**
- `src/features/ledger/transactions/TransactionForm.tsx` — add form with vault/agent branches
- `src/features/ledger/transactions/TransactionList.tsx` — list with filters
- `src/features/ledger/transactions/WithdrawalPreview.tsx` — derived preview block
- `src/features/ledger/snapshots/SnapshotForm.tsx`
- `src/features/ledger/snapshots/SnapshotList.tsx`
- `src/features/ledger/accounts/AccountForm.tsx`, `AccountList.tsx` — add/manage accounts (lightweight)
- `src/features/ledger/products/ProductForm.tsx`, `ProductList.tsx` — add/manage products
- `src/data/hooks/useLedgerTransactions.ts`, `useLedgerSnapshots.ts`, `useLedgerAccounts.ts`, `useLedgerProducts.ts` — TanStack Query hooks (`['ledger', 'transactions']` etc.)
- `src/domain/validation/ledger.ts` — zod schemas for each form
- `src/features/ledger/__tests__/TransactionForm.test.tsx` — vault deposit + vault withdrawal preview match accounting fixtures
- `src/features/ledger/__tests__/SnapshotForm.test.tsx`

**Edited:**
- `src/features/ledger/views/TransactionsView.tsx`, `SnapshotsView.tsx` — replace placeholders with the real composition
- `src/features/ledger/views/PortfolioView.tsx`, `PositionsView.tsx`, `WeeklyView.tsx` — invalidation wiring (or this lands in the next UI spec — keep this spec scoped to the form)

## Out of scope

- Portfolio / Positions / Weekly tables (next spec)
- CSV import (later spec)
- Bulk edit
- Mobile-native UI
- Account/product editing beyond create + soft delete (no rename in V1)

## Implementation notes

- Where possible, both account-then-product or product-then-account selection orders should be supported; for simplicity, MVP picks account first → product list filters to those that have any prior transaction with that account, plus an "all" toggle. (Products are venue-level, not account-level — see `ledger-data-model` notes.)
- Withdrawal preview: render `null` placeholders (`—`) until both `sharePrice` (vault) and one of `usdcAmount` / `shares` are entered. Do not show `0` — that misleads.
- Duplicate warning: when a draft matches an existing row on `(accountId, productId, kind, occurredAt date, usdcAmount)`, show a non-blocking yellow banner. User can still submit.
- Dates: store as ISO timestamps in UTC; display in user timezone (settings drawer).
- Reuse existing date input pattern from `src/features/spot/LotForm.tsx` if the styling matches.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -Rn "style={{" src/features/ledger   # expect: empty
find src/features/ledger src/data/hooks/useLedger*.ts src/domain/validation/ledger.ts -type f | xargs wc -l | awk '$1 > 250'   # expect: empty
```

Browser smoke (`yarn dev`):
- `Ledger` → `Transactions` → add a vault deposit (4000 USDC, SP 1.00); row appears in list
- Add a vault withdrawal (500 USDC, SP 1.46); preview shows burned shares ≈ 342.4658, realized profit 500, principal touched 0, remaining shares ≈ 3657.5342
- Add an agent deposit (1000 USDC); no `sharePrice` field appears
- `Ledger` → `Snapshots` → add Golden vault SP 1.46 and XAU agent equity 1051; rows persist
- `Ledger` → `Weekly` (placeholder for now) does not error; once `ledger-weekly-review-ui` lands it will reflect the new transactions

Regression: existing `Trading` mode panels unchanged.

Final step: rename `docs/backlog/todo.ledger-manual-forms.md` → `docs/backlog/done.ledger-manual-forms.md`.
