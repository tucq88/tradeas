# ledger-vault-engine — deterministic vault accounting

**Epic**: ledger · **Phase**: 1 · **Severity**: 🔴 · **Depends on**: ledger-data-model

## Goal

Implement deterministic vault accounting (share-based) for deposits, withdrawals, current value, lifetime PnL, and profit-first withdrawal classification. Pure functions, no React, no Supabase. All money/share math through `D()` (Decimal).

## Acceptance criteria

- [ ] `computeVaultPosition(transactions, snapshots, asOf)` returns `{ sharesHeld, totalDeposited, totalWithdrawn, latestSharePrice, currentValue, lifetimePnl, warnings }` — all numeric fields as `Decimal`
- [ ] Deposit: shares minted = `usdcAmount / sharePrice` when `sharesDelta` is not provided; otherwise use `sharesDelta`
- [ ] Withdrawal: shares burned = `usdcAmount / sharePrice` when `sharesDelta` not provided; otherwise use `sharesDelta`
- [ ] Withdrawal that exceeds current `sharesHeld` returns warning `over_withdraw` (no implicit clamp; classify what was actually withdrawn)
- [ ] `currentValue = sharesHeld × latestSharePrice`
- [ ] `lifetimePnl = currentValue + totalWithdrawn - totalDeposited`
- [ ] `classifyWithdrawal({ withdrawalAmount, valueBeforeWithdrawal, depositsBeforeWithdrawal })` returns `{ availableProfit, realizedProfit, principalTouched }` (profit-first waterfall, see `notes.ledger-context.md`)
- [ ] Missing latest share price returns `currentValue = null`, warning `missing_snapshot`; lifetime PnL is `null` (not zero)
- [ ] No JS floating-point arithmetic for money, shares, or share prices anywhere in `src/domain/accounting/vault.ts`
- [ ] Test fixtures from `notes.ledger-context.md` (deposit 4000 @ SP 1.00 → 4000 shares; withdraw 500 @ SP 1.46 → burns 342.465753424657534247 shares; remaining 3657.534246575342465753; current value at SP 1.46 = 5340; lifetime PnL = 1840) all pass
- [ ] `yarn test vault` green

## Files touched

**New:**
- `src/domain/accounting/vault.ts` — `computeVaultPosition`, helpers
- `src/domain/accounting/withdrawals.ts` — `classifyWithdrawal` (shared with agent engine in next spec)
- `src/domain/accounting/snapshots.ts` — pure `latestAtOrBefore(snapshots, asOf)` helper
- `src/domain/accounting/types.ts` — `VaultPositionState`, `WithdrawalClassification`, `AccountingWarning` union
- `src/domain/accounting/__tests__/vault.test.ts`
- `src/domain/accounting/__tests__/withdrawals.test.ts`

## Out of scope

- Weekly review calculations (next-but-one spec)
- Agent equity calculations (next spec)
- UI rendering
- Snapshot fetching from Supabase (data layer concern)
- FIFO / LIFO tax-lot accounting

## Implementation notes

- Sort transactions by `occurredAt`, tiebreak by stable `id`. Walk forward; do not assume input order.
- Treat `sharesHeld` as a signed running sum of `+sharesDelta` (deposits) and `-sharesDelta` (withdrawals). Compute the implicit `sharesDelta` from `usdcAmount / sharePrice` when not stored.
- `principalTouchedByWithdrawal` is event-level — not the same as lifetime cash recovered (computed elsewhere).
- For withdrawal classification, `valueBeforeWithdrawal` is `sharesHeldBeforeEvent × sharePriceAtEvent`; `depositsBeforeWithdrawal` is the running deposit total *before* this event.
- Return warnings as a typed union — UI and (future) AI coach must consume the same fact set. Suggested initial warnings: `missing_snapshot | stale_snapshot | over_withdraw | negative_shares`.
- Decimal serialization: never round in compute. UI calls `.toFixed(n)` at the leaf.
- Skip `archived_at !== null` rows in input (caller's responsibility, but document it).

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
yarn test vault
grep -Rn "Number(\|parseFloat\|parseInt\|Math\.round" src/domain/accounting   # expect: empty
grep -Rn "from ['\"]react" src/domain/accounting   # expect: empty
```

Regression: multiple deposits at different share prices still aggregate into one position state; the test suite covers a multi-deposit fixture.

Final step: rename `docs/backlog/todo.ledger-vault-engine.md` → `docs/backlog/done.ledger-vault-engine.md`.
