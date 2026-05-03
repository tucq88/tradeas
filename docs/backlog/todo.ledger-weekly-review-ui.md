# ledger-weekly-review-ui — Sunday weekly review screen

**Epic**: ledger · **Phase**: 2 · **Severity**: 🟠 · **Depends on**: ledger-weekly-review-engine, ledger-manual-forms

## Goal

Build the `Weekly` sub-view: a Sunday-default review where the user decides what profit may be taken without violating the principal floor or capital story.

## Acceptance criteria

- [ ] `Weekly` sub-view defaults to the current (or most-recent-completed) Sunday-start week
- [ ] WeekPicker control: prev / next / "this week" buttons; date range label (`Sun MMM D – Sat MMM D`)
- [ ] Account filter and product-type filter (matches `Positions` filter affordances)
- [ ] Table columns: account, product, type, start value, end value, weekly deposits, weekly withdrawals, weekly PnL, weekly ROI, suggested TP USDC, suggested TP shares (vault only — `—` for agent), lifetime PnL, status badge
- [ ] Suggested-TP cells render with a small `?` tooltip (or sub-text): "Accounting calculation. Not trading advice." (final disclaimer copy lives in `ledger-risk-disclaimers`; this spec uses the placeholder)
- [ ] Missing-snapshot rows show inline `→ add start snapshot` / `→ add end snapshot` links that switch to the `Snapshots` tab pre-filtered
- [ ] Negative `weeklyPnl` renders normally (red text), `suggestedTpUsdc = 0` — not flagged as an error
- [ ] No execution buttons (no "withdraw now", no "place trade")
- [ ] All values come from `calculateWeeklyReview` — no UI-side recomputation
- [ ] No `style={{`; no file > 250 lines
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green

## Files touched

**New:**
- `src/features/ledger/weekly/WeeklyReviewTable.tsx`
- `src/features/ledger/weekly/WeekPicker.tsx`
- `src/features/ledger/weekly/WeeklyStatusBadge.tsx` — may reuse `PositionStatusBadge` if mappings match
- `src/data/hooks/useWeeklyReview.ts` — composes positions + week boundary into rows
- `src/features/ledger/__tests__/WeeklyReviewTable.test.tsx`
- `src/features/ledger/__tests__/WeekPicker.test.tsx`

**Edited:**
- `src/features/ledger/views/WeeklyView.tsx` — replace placeholder

## Out of scope

- Scheduled reminders / email digests
- Tax reporting
- LLM recommendations (post-MVP)
- Withdrawal execution (never)
- Multi-week historical comparison view (V1 = single week)
- Persisting selected week across reloads (URL-less app)

## Implementation notes

- The week table is the product's primary workflow surface — make it scannable. Match table density of `Positions`.
- Disclaimer copy here is a placeholder; final wording + placement is owned by `ledger-risk-disclaimers`. Do not pre-empt that spec by polishing copy.
- Week boundary comes from user timezone in settings drawer; if no timezone is set, fall back to the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- `WeekPicker` "this week" button resets to the live current week; in Sunday-week semantics, "this week" includes today even on Sunday morning.
- ROI display: `weeklyPnl / startValue` as percent with one decimal (e.g. `+5.8%`); render `—` when `startValue` is `null` (missing snapshot) or `0`.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -Rn "withdraw.*execute\|execute.*withdraw\|place.*order\|trade.*now" src/features/ledger/weekly   # expect: empty
grep -Rn "style={{" src/features/ledger/weekly   # expect: empty
find src/features/ledger/weekly -type f | xargs wc -l | awk '$1 > 250'   # expect: empty
```

Browser smoke (seeded Golden vault: start value 5520, end value 5340, withdrawal 500, deposits 0):
- `Weekly` shows Golden row weekly PnL 320.00, suggested TP 320.00, suggested TP shares ≈ 219.178082
- WeekPicker prev → previous week shows different values (or missing-snapshot row for any week without snapshots)
- Remove the end snapshot → Golden row status flips to `missing snapshot`; row carries `→ add end snapshot` link
- Filter by `agent` → Golden row hidden; `Portfolio` totals unchanged

Regression: changing the week filter does not change `Portfolio` aggregate KPIs.

Final step: rename `docs/backlog/todo.ledger-weekly-review-ui.md` → `docs/backlog/done.ledger-weekly-review-ui.md`.
