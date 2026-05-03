# ledger-risk-disclaimers — risk-aware copy across ledger surfaces

**Epic**: ledger · **Phase**: 4 · **Severity**: 🟡 · **Depends on**: ledger-weekly-review-ui, ledger-profit-bank-ui

## Goal

Add risk-aware copy and disclaimers to ledger surfaces so suggested-TP language can never be misread as financial advice. This is the non-AI half of the original Codex spec; the AI coach is a separate post-MVP epic.

## Acceptance criteria

- [ ] `<LedgerDisclaimer />` component exists and renders: "Trading involves risk. Performance is not guaranteed. Past results are not indicative of future returns. Suggested TP is an accounting calculation, not financial advice."
- [ ] Disclaimer renders at the bottom of `Weekly`, `Profit Bank`, and any export download UI
- [ ] Suggested-TP cells in `Weekly` show a small inline tooltip / footnote: "Accounting calculation. Not trading advice."
- [ ] CSV exports of `Weekly` and `Profit Bank` include a header comment line: `# Tradeas ledger export — accounting calculations only, not financial advice`
- [ ] Banned phrases never appear in user-facing strings: `guaranteed`, `risk-free`, `cannot lose`, `safe profit`, `safe weekly income`, `financial advice` (except inside disclaimer/negative test names)
- [ ] No emoji in disclaimer copy (matches project convention)
- [ ] No file > 250 lines
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green

## Files touched

**New:**
- `src/features/ledger/risk/LedgerDisclaimer.tsx` — reusable disclaimer block
- `src/features/ledger/risk/SuggestedTpFootnote.tsx` — small inline tooltip / `<sup>` footnote
- `src/features/ledger/__tests__/LedgerDisclaimer.test.tsx`

**Edited:**
- `src/features/ledger/views/WeeklyView.tsx` — mount `<LedgerDisclaimer />` at the bottom
- `src/features/ledger/views/ProfitBankView.tsx` — mount `<LedgerDisclaimer />` at the bottom
- `src/features/ledger/weekly/WeeklyReviewTable.tsx` — replace placeholder TP tooltip with `<SuggestedTpFootnote />`
- `src/domain/imports/ledgerExport.ts` — prepend the header-comment line to CSV exports

## Out of scope

- AI coach UI / prompts / model integration (separate post-MVP epic)
- Legal review / sign-off automation
- Localization of disclaimer text (English only for MVP)
- Server-side enforcement (this is UI guardrails only)

## Implementation notes

- The disclaimer is informational, not a click-to-accept gate. It should be visible but not block workflow.
- Match existing footnote / tooltip style if any exists; otherwise use a minimal `<span title="...">` or inline gray text — no new tooltip library.
- Keep banned-phrase grep guard scoped to user-facing source — match `src/features/**` and `src/components/**`, not `tests/**` or this spec's negative-example doc strings.
- CSV export header-comment is a single line beginning with `#` that most spreadsheet tools either treat as a comment row or as a benign extra row. Document this in the spec but do not invent CSV dialect handling.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -REn "guaranteed|risk-free|cannot lose|safe profit|safe weekly income" src/features src/components | grep -v "__tests__\|test\.tsx\|test\.ts"   # expect: empty
grep -RIn "financial advice" src/features src/components | grep -v "Disclaimer\|Footnote\|__tests__"   # expect: empty (only the disclaimer + footnote should mention it, in a negation)
```

Browser smoke:
- `Ledger` → `Weekly`: disclaimer visible at bottom; suggested-TP cells carry the footnote / tooltip
- `Ledger` → `Profit Bank`: disclaimer visible at bottom
- Export `Weekly` CSV → first line is `# Tradeas ledger export — accounting calculations only, not financial advice`

Regression: existing `Trading` mode panels untouched; no disclaimer leaks into perp / spot UI.

Final step: rename `docs/backlog/todo.ledger-risk-disclaimers.md` → `docs/backlog/done.ledger-risk-disclaimers.md`.
