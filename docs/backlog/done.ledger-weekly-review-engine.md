# ledger-weekly-review-engine — Sunday-based weekly PnL + suggested TP

**Epic**: ledger · **Phase**: 1 · **Severity**: 🔴 · **Depends on**: ledger-vault-engine, ledger-agent-engine

## Goal

Implement Sunday-based weekly performance review and suggested TP calculation across vaults and agents. This is the user's primary weekly decision surface.

## Acceptance criteria

- [ ] `weekBoundaries(asOf, { weekStartDay = 'sunday', timezone })` returns `{ start, end }` (ISO timestamps); end is exclusive (next week's start)
- [ ] `calculateWeeklyReview({ positions, asOf, weekStartDay, timezone })` returns one row per `(accountId, productId)` with: `startValue`, `endValue`, `weeklyDeposits`, `weeklyWithdrawals`, `weeklyPnl`, `weeklyRoi`, `suggestedTpUsdc`, `suggestedTpShares`, `lifetimePnl`, `warnings`
- [ ] `weeklyPnl = endValue + weeklyWithdrawals - weeklyDeposits - startValue`
- [ ] `suggestedTpUsdc = max(0, min(weeklyPnl, currentValue - totalDeposited))`
- [ ] `suggestedTpShares` is populated for vault rows (`suggestedTpUsdc / latestSharePrice`); `null` for agent rows
- [ ] Missing `startValue` or `endValue` snapshot → row carries warning `missing_snapshot`; `weeklyPnl` and `suggestedTp` are `null` (not zero)
- [ ] Negative `weeklyPnl` → `suggestedTpUsdc = 0` (no negative TP)
- [ ] Default `weekStartDay = 'sunday'`; week boundary computed in user timezone
- [ ] Stale-snapshot threshold for weekly review = 7 days (overrides agent engine's default 3)
- [ ] Test fixtures from context (start 5520, end 5340, withdrawals 500, deposits 0 → weekly PnL 320; current 5340, deposited 4000, weekly PnL 320 → suggested TP 320; SP 1.46 → suggested TP shares 219.178082191780821918; weekly PnL -50 → suggested TP 0) all pass
- [ ] `yarn test weeklyReview` green

## Files touched

**New:**
- `src/domain/accounting/weeklyReview.ts` — `calculateWeeklyReview`, `weeklyTpForPosition`
- `src/domain/accounting/time.ts` — `weekBoundaries`, `weekStartFor(asOf, weekStartDay, timezone)`
- `src/domain/accounting/__tests__/weeklyReview.test.ts`
- `src/domain/accounting/__tests__/time.test.ts`

**Edited:**
- `src/domain/accounting/types.ts` — add `WeeklyReviewRow`, `WeekStartDay`

## Out of scope

- UI table (separate spec)
- Notification scheduling
- Automated withdrawals
- Personalized financial advice
- Multi-week historical view (V1 is current-week only)

## Implementation notes

- Use the same position-state functions as the dashboard (`computeVaultPosition`, `computeAgentPosition`) — do not re-derive position math here. Weekly review is a *projection* over those states at two timestamps (`start` and `end`).
- `weeklyDeposits` / `weeklyWithdrawals` are summed from transactions whose `occurredAt` falls in `[start, end)` — keep weekly cashflows separate from lifetime totals.
- Do not annualize weekly ROI in V1 (no APR / APY / 365×). Spec's grep guard enforces this.
- Suggested TP is an accounting helper, not a recommendation — copy that surfaces it must say so (handled in `ledger-risk-disclaimers`).
- Timezone handling: use `Intl.DateTimeFormat` for boundary calculation; do not pull in `date-fns-tz` or similar unless the test suite forces it.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
yarn test weeklyReview
yarn test time
grep -Rn "365\|APR\|APY\|annual" src/domain/accounting   # expect: empty (or only in test guard names)
```

Regression: changing user timezone changes week boundary only via `time.ts`; vault + agent compute functions unchanged.

Final step: rename `docs/backlog/todo.ledger-weekly-review-engine.md` → `docs/backlog/done.ledger-weekly-review-engine.md`.
