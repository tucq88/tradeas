# ledger-foundation — top-level mode toggle, ledger feature skeleton, decimal helper

**Epic**: ledger · **Phase**: 0 · **Severity**: 🔴 · **Depends on**: —

## Goal

Add a top-level `Trading | Ledger` mode toggle in the header; scaffold `src/features/ledger/` with placeholder sub-view tabs; create the `src/domain/` cross-feature boundary with `accounting/` as its first inhabitant; add `decimal.js` as the precision primitive for all ledger money/share math.

## Acceptance criteria

- [ ] Header has a 2-button mode toggle (`Trading` | `Ledger`); state lives in `App.tsx` (no router); switching mode swaps the body content; `RefreshAllButton` and the settings gear stay visible in both modes
- [ ] `Trading` mode renders the existing 4-panel grid unchanged (Scratchpad / Perp / Spot / Allocation)
- [ ] `Ledger` mode renders a 7-tab sub-nav: `Portfolio` · `Positions` · `Weekly` · `Profit Bank` · `Transactions` · `Snapshots` · `Imports`; each tab points to a placeholder sub-view that shows the tab name only (no fake dashboards, no fake numbers)
- [ ] `src/domain/accounting/` exists as a new module boundary; no file under `src/domain/` imports from `react`, `react-dom`, `@/components`, `@/features`, `@/ui`, `@tanstack/react-query`, or `@supabase/supabase-js`
- [ ] `src/lib/decimal.ts` wraps `decimal.js` and exports a `D(value: string | number | Decimal)` constructor + commonly used helpers (`add`, `sub`, `mul`, `div`, `max`, `min`, `gt`, `gte`, `eq`, `toFixed(decimals)`, `toNumber()`)
- [ ] `decimal.js` added to `dependencies` in `package.json`
- [ ] Mode toggle uses Tailwind utilities only — no `style={{`
- [ ] No new file > 250 lines
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green

## Files touched

**New:**
- `src/lib/decimal.ts` — `decimal.js` re-export + thin helpers
- `src/lib/__tests__/decimal.test.ts` — sanity: `D('0.1').add('0.2').eq('0.3')` is true; `toFixed(12)` precision preserved
- `src/domain/accounting/index.ts` — empty module entrypoint (later specs add `vault.ts`, `agent.ts`, `weeklyReview.ts`)
- `src/features/ledger/LedgerPanel.tsx` — root sub-nav + view switcher (≤ 120 lines target)
- `src/features/ledger/views/PortfolioView.tsx`, `PositionsView.tsx`, `WeeklyView.tsx`, `ProfitBankView.tsx`, `TransactionsView.tsx`, `SnapshotsView.tsx`, `ImportsView.tsx` — placeholder, ≤ 20 lines each
- `src/features/ledger/__tests__/LedgerPanel.test.tsx` — sub-nav renders 7 tabs; clicking each tab swaps the visible view

**Edited:**
- `src/App.tsx` — add `mode` state (`'trading' | 'ledger'`), header toggle, conditional body
- `package.json` — add `decimal.js` dependency

## Out of scope

- Any actual ledger calculation logic (later specs)
- Schema / migration (next spec)
- Forms, tables, real data (later specs)
- Replacing existing perp/spot float math with Decimal — Decimal is scoped to ledger surfaces
- Adding `react-router` or any URL routing
- Persisting the active mode/tab across reloads (in-memory only for MVP)

## Implementation notes

- The mode toggle is a header-level concern, not a route — keeps the project's "single page" stance intact.
- `src/domain/` is the cross-feature domain boundary; `accounting/` is the first subfolder. Future cross-cutting concerns (`fees/` for funding/commission math, `account/` if the venue-account abstraction needs to bridge ledger + perp) will join under `src/domain/`. Do **not** pre-create them.
- Decimal precision: `decimal.js` defaults to 20 significant digits — leave at default. `toFixed` for display only; never round intermediate values.
- Placeholder sub-views must not render any fake numbers — purely the tab name. Reviewers and future agents should not mistake them for "done".
- Keep `LedgerPanel.tsx` tab state local (`useState<TabId>`); no global store.
- The mode-toggle button style should match the existing header gear/refresh button affordances (h-7, hover bg-bg-inset). Active mode gets `text-fg-1`, inactive `text-fg-3`.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -Rn "from ['\"]react" src/domain   # expect: empty
grep -Rn "from ['\"]@tanstack/react-query" src/domain   # expect: empty
grep -Rn "from ['\"]@supabase" src/domain   # expect: empty
grep -Rn "style={{" src/features/ledger src/App.tsx   # expect: empty
find src/features/ledger src/domain src/lib/decimal.ts -type f | xargs wc -l | awk '$1 > 250'   # expect: empty
```

Browser smoke (`yarn dev`):
- Header shows `Trading | Ledger` toggle; default = `Trading`; current 4-panel grid renders unchanged
- Click `Ledger` → body switches to a 7-tab sub-nav; default tab = `Portfolio`; clicking each of the 7 tabs swaps the visible sub-view title
- Click `Trading` → returns to existing dashboard; perp + spot rows intact; refresh button still works
- Settings drawer opens from both modes

Regression: perp panel mark prices, spot lots, allocation donut, scratchpad, refresh-all behavior all unchanged.

Final step: rename `docs/backlog/todo.ledger-foundation.md` → `docs/backlog/done.ledger-foundation.md`.
