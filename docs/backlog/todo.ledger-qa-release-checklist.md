# ledger-qa-release-checklist — release validation suite for ledger MVP

**Epic**: ledger · **Phase**: 5 · **Severity**: 🔴 · **Depends on**: ledger-csv-import-export, ledger-weekly-review-ui, ledger-profit-bank-ui, ledger-risk-disclaimers

## Goal

Final release validation suite for the ledger MVP. Reviewers can prove accounting, UI, imports, and risk boundaries are working together with one runbook.

## Acceptance criteria

- [ ] Seed fixture covers ≥ 2 accounts, ≥ 2 vault products, ≥ 1 agent product, ≥ 5 transactions, ≥ 4 snapshots; loadable via `yarn db:seed` extension
- [ ] Unit tests cover: vault deposits, vault withdrawals, vault profit-first classification, agent equity, weekly review (positive PnL, negative PnL, missing snapshot), suggested TP, house-money flip, CSV parse + validate, name-to-ID normalization
- [ ] Vitest UI / E2E tests cover: manual deposit (vault + agent), manual withdrawal with preview, snapshot entry, weekly review reflects new data, profit bank flips house money, CSV import partial mode, CSV import all-or-nothing mode
- [ ] Import → export round-trip preserves raw ledger rows (count + content)
- [ ] Risk language present on `Weekly`, `Profit Bank`, and export header
- [ ] No route / button exposes trading execution or auto-withdrawal
- [ ] No source file in `src/features/ledger`, `src/domain/accounting`, `src/domain/imports`, `src/data/ledger`, `src/lib/csv`, `src/lib/decimal.ts` exceeds 250 lines unless explicitly justified in code review
- [ ] `docs/release-checklist.ledger.md` exists — short human runbook (≤ 1 page) for a reviewer to walk
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green

## Files touched

**New:**
- `scripts/db-seed-ledger.ts` — extends or composes with existing `scripts/db-seed.ts` to add ledger fixtures
- `src/domain/accounting/__tests__/fixtures.ts` — Golden vault + XAU agent canonical fixture (deposit 4000, withdrawal 500, latest SP 1.46 → shares 3657.534246575342465753, current value 5340, lifetime PnL 1840, weekly PnL 320)
- `src/features/ledger/__tests__/e2e.test.tsx` — Vitest + Testing Library full-loop test (transaction → snapshot → weekly → profit bank)
- `docs/release-checklist.ledger.md` — human reviewer runbook

**Edited:**
- `package.json` — add `db:seed:ledger` script if separate from `db:seed`

## Out of scope

- Load testing beyond typical MVP data (single-user app)
- Legal sign-off automation
- Production monitoring setup
- Real venue API testing
- Lighthouse / a11y audit beyond reasonable defaults

## Implementation notes

- Prefer deterministic fixtures over mocked random data — accounting must reproduce exactly from the CONTEXT-listed numbers.
- E2E tests assert visible UI text + numeric outputs. They should also assert the *absence* of execution buttons (no element with text matching `/withdraw now|execute trade|place order/i`).
- Release checklist (`docs/release-checklist.ledger.md`) lives outside `docs/backlog/` — it's a runbook, not a spec. Keep it short enough that a human will actually use it.
- Add a regression test for stale-snapshot warning: bump `staleAfterDays` past the snapshot age, assert `stale_snapshot` warning surfaces in `Positions` row.
- Verify that the ledger feature does not leak into `Trading` mode KPIs: `Trading` mode totals (perp / spot) are not affected by ledger transactions.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
yarn db:seed:ledger
yarn test
find src/features/ledger src/domain/accounting src/domain/imports src/data/ledger src/lib/csv src/lib/decimal.ts -type f | xargs wc -l | awk '$1 > 250'   # expect: empty (or each line is justified in PR)
grep -REn "execute.*trade|place.*order|withdraw.*now|guaranteed|risk-free" src tests   # expect: only in negative tests / disclaimer files
```

Manual reviewer walk (use `docs/release-checklist.ledger.md`):
- From a freshly seeded DB, complete one full loop: `Transactions` → add deposit and withdrawal → `Snapshots` → add SP and equity → `Weekly` → confirm suggested TP matches fixture → `Profit Bank` → confirm house-money status → export CSV → reimport → no duplicates after dedupe dismissal
- Toggle to `Trading` mode → existing perp / spot / allocation / scratchpad render unchanged

Regression: full existing test suite green; spot CSV import still works (now via `src/lib/csv/`).

Final step: rename `docs/backlog/todo.ledger-qa-release-checklist.md` → `docs/backlog/done.ledger-qa-release-checklist.md`.
