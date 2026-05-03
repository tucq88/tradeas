# ledger-profit-bank-ui — Profit Bank screen

**Epic**: ledger · **Phase**: 2 · **Severity**: 🟡 · **Depends on**: ledger-portfolio-positions-ui

## Goal

Build the `Profit Bank` sub-view: realized withdrawals, cash recovered, principal touched, and house-money status per (account, product). Answers "am I playing with house money yet?".

## Acceptance criteria

- [ ] `Profit Bank` sub-view shows one row per `(accountId, productId)` with: account, product, type, total deposited, total withdrawn, realized profit taken, principal touched by withdrawals, cash still needed to recover deposits, cash recovered %, house money (`Yes` / `No`)
- [ ] Global totals row aggregates from position-level rows (sum of all numeric columns; cash recovered % = total withdrawn / total deposited; house-money count separately)
- [ ] `cashRecoveredPercent = totalWithdrawn / totalDeposited` (capped display at `>=` 100% but value not clamped)
- [ ] `cashStillNeededToRecoverDeposits = max(0, totalDeposited - totalWithdrawn)`
- [ ] `houseMoney` is `true` only when `totalWithdrawn >= totalDeposited`
- [ ] `principalTouchedByWithdrawals` is the sum of event-level `principalTouched` across all withdrawal transactions for that position — **not** the same as `cashStillNeeded`; column copy/header must distinguish
- [ ] No tax language anywhere (`tax`, `taxable`, `realized gain`)
- [ ] No "guaranteed", "safe profit", "risk-free" language
- [ ] All numbers derived from already-computed position state; new helper `computeProfitBank(positions)` if needed
- [ ] No `style={{`; no file > 250 lines
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green

## Files touched

**New:**
- `src/features/ledger/profit-bank/ProfitBankTable.tsx`
- `src/features/ledger/profit-bank/HouseMoneyBadge.tsx`
- `src/domain/accounting/profitBank.ts` — `computeProfitBank(positions)` if derivation is non-trivial
- `src/features/ledger/__tests__/ProfitBankTable.test.tsx`
- `src/domain/accounting/__tests__/profitBank.test.ts` (only if `profitBank.ts` exists)

**Edited:**
- `src/features/ledger/views/ProfitBankView.tsx` — replace placeholder

## Out of scope

- Tax reporting (never in scope)
- Wallet-balance reconciliation outside recorded withdrawals
- External bank / exchange reconciliation
- Profit-reinvestment source tracking
- "Bank account" abstraction beyond the per-position view

## Implementation notes

- This screen answers the user's emotional question ("house money yet?") with strict accounting language. Keep copy clinical: "Total withdrawn", "Cash recovered", "House money: Yes/No".
- Each row links to a transactions list pre-filtered to that `(accountId, productId)` — leverage the cross-tab link pattern from `Positions`.
- `principalTouched` aggregation: requires walking each withdrawal through `classifyWithdrawal` against the running deposits-before / value-before at that point in time. The vault/agent engines already do this per position — expose the per-event classifications via the position state so this view can sum them.
- House-money badge: small green pill when true, neutral gray "Not yet" when false. No celebration emoji.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -Rn "tax\|taxable\|guaranteed\|safe profit\|risk-free" src/features/ledger/profit-bank   # expect: empty
grep -Rn "style={{" src/features/ledger/profit-bank   # expect: empty
find src/features/ledger/profit-bank -type f | xargs wc -l | awk '$1 > 250'   # expect: empty
```

Browser smoke (seeded Golden vault: deposit 4000, withdrawal 500):
- `Profit Bank` Golden row: total deposited 4000.00, total withdrawn 500.00, realized profit taken 500.00, principal touched 0.00, cash still needed 3500.00, cash recovered 12.5%, house money `No`
- Add a withdrawal of 4000 USDC → Golden row updates: total withdrawn 4500, house money `Yes`, cash recovered 112.5%
- Globals row mirrors the sum across positions

Regression: `Positions` `cash recovered %` (if shown there) matches the same value here.

Final step: rename `docs/backlog/todo.ledger-profit-bank-ui.md` → `docs/backlog/done.ledger-profit-bank-ui.md`.
