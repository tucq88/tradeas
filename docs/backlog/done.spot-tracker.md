# spot-tracker — persisted spot portfolio panel

**Epic**: spot · **Phase**: 6 · **Severity**: 🔴 · **Depends on**: prices-binance, data-supabase

## Goal

Persisted spot portfolio panel: lots table with inline create/edit, WIP→Done lifecycle (Done captures exit_price + exit_date → realized PnL), per-asset aggregation row with live Binance spot prices, and a closed-lots realized-PnL summary. Replaces the manual Google Sheets tracker for DCA management.

## Acceptance criteria

- [ ] Panel renders in the dashboard grid using primitives from Stage 1; layout mirrors `docs/design/ui_kits/dashboard/Spot.jsx` (asset / qty / mark / value / cost basis / pnl columns)
- [ ] Inline create form (`LotForm`) accepts date, asset (base symbol), amount, entry_price, cost_usd; submit calls `spotLots.create` (Stage 5 DAL) with optimistic insert
- [ ] Inline edit on each WIP row updates the same fields via `spotLots.update`; cancel reverts
- [ ] Marking a lot Done is a single confirm action that requires exit_price + exit_date inline (no modal navigation); on confirm calls `spotLots.markDone`, optimistic UI flips row to realized summary
- [ ] Per-asset aggregation row (WIP only) shows weighted avg cost, total invested, current value, unrealized PnL ($ + %); updates within the same render frame as a lot create/edit/markDone
- [ ] Realized PnL summary lists Done lots grouped by asset with realized $ per lot and total
- [ ] Per-panel refresh button revalidates `useSpotPrices(symbols[])` for every unique asset in WIP lots; last-refreshed timestamp surfaced (Stage 4 contract)
- [ ] Empty states: no lots yet (CTA to add first), no WIP lots (aggregation hidden), no Done lots (realized summary hidden)
- [ ] Asset symbol stored as base (`BTC`); Binance call uses `BTCUSDT` via `src/lib/symbols.ts`
- [ ] No file > 250 lines
- [ ] No inline calculator/sizing math UI in this panel — that lives in scratchpad
- [ ] No allocation-pie rendering here (Stage 8)
- [ ] No notes UI in this stage (Stage 9)
- [ ] No `style={{` in `src/features/spot/**`
- [ ] Spec file renamed `todo.spot-tracker.md` → `done.spot-tracker.md` after all checks pass

## Files touched

**New:**
- `src/features/spot/SpotPanel.tsx` — top-level panel: header, refresh, form, WIP table, realized summary
- `src/features/spot/LotRow.tsx` — single WIP lot row, inline edit + Done flow
- `src/features/spot/LotForm.tsx` — inline create form
- `src/features/spot/AssetAggregation.tsx` — per-asset aggregation row renderer
- `src/features/spot/RealizedSummary.tsx` — Done lots grouped by asset
- `src/features/spot/aggregate.ts` — pure aggregation math
- `src/lib/symbols.ts` — base ↔ Binance pair normalization
- `src/features/spot/__tests__/aggregate.test.ts`
- `src/features/spot/__tests__/symbols.test.ts`

**Edited:**
- `src/App.tsx` (or dashboard shell from Stage 1) — mount `<SpotPanel />` in its grid slot

## Out of scope

- Portfolio allocation pie (Stage 8) — though `aggregate.ts` outputs feed it later
- Trade notes per lot (Stage 9)
- Copy-paste / CSV import; auth; RLS; multi-currency
- WebSocket price streaming
- Sizing / liquidation math (perp + scratchpad concerns)

## Implementation notes

- Aggregation math (`aggregate.ts`, pure, fully unit-tested):
  - WIP per-asset: `weightedAvgCost = sum(lot.cost_usd) / sum(lot.amount)`; `totalInvested = sum(lot.cost_usd)`; `currentValue = sum(lot.amount) * spotPrice`; `unrealizedPnl = currentValue - totalInvested`; `pctDelta = totalInvested > 0 ? unrealizedPnl / totalInvested : 0`
  - Realized PnL per Done lot: `(exit_price - entry_price) * amount`; sum per asset and overall
  - Guard divide-by-zero when an asset has zero amount
- Symbol normalization in `src/lib/symbols.ts`: `toBinancePair(base) → \`${base.toUpperCase()}USDT\``; `fromBinancePair` inverse; reject empty / non-alphanumeric. Both `SpotPanel` and any future caller import from here — never inline `+ 'USDT'`.
- Data flow: `SpotPanel` calls `spotLots.list()` via TanStack Query; derives `wip` / `done` arrays; computes unique base symbols → `useSpotPrices(symbols)`; passes `(lots, priceMap)` into `aggregate.ts`. Keep network and math separate.
- Optimistic mutations: on create/update/markDone, mutate the `spotLots.list` query cache so the aggregation row updates within the same render frame. Roll back on error.
- Done flow: `LotRow` exposes a "Mark Done" affordance; clicking expands two inputs (exit_price, exit_date) + confirm/cancel — single confirm action, no modal.
- Reuse Stage 1 primitives (`Card`, `Input`, `Button`, `Badge`, `MetricRow`) and Stage 1 number formatters; do not re-implement `toFixed` locally.
- Keep each component lean — split if any file approaches 250 lines.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

All four green. Then:

```bash
# Negative greps
grep -RE "style=\{\{" src/features/spot/ 2>/dev/null            # must be empty
grep -RE "\\+ ['\"]USDT['\"]" src/features/spot/ 2>/dev/null     # must be empty (use symbols.ts)
grep -RE "toFixed\\(" src/features/spot/ 2>/dev/null             # must be empty (use shared formatters)
find src/features/spot src/lib/symbols.ts -type f -exec wc -l {} \; | awk '$1 > 250'   # must be empty
```

Unit tests (`yarn test`):
- `aggregate.test.ts`: multi-lot single asset (weighted avg correct), multi-asset (segregation), mix WIP/Done (Done excluded from WIP aggregation, included in realized), zero-amount guard, missing price → unrealized fields surface as `null`/skipped
- `symbols.test.ts`: `BTC` ↔ `BTCUSDT`, lowercase input normalized, empty/invalid rejected

Manual browser smoke:
- Open dashboard → spot panel visible, empty state with "add lot" CTA
- Create lot: `BTC`, amount `0.05`, entry `60000`, cost `3000`, today's date → row appears in WIP table; aggregation row shows current value using live `BTCUSDT` mark; unrealized PnL + % rendered with profit/loss color
- Add second `BTC` lot → weighted avg cost recomputes
- Edit first lot's amount inline → aggregation updates same render frame
- Mark first lot Done with exit `65000`, today's date → row leaves WIP, appears in realized summary with `(65000 - 60000) * 0.05 = $250`
- Click panel refresh → last-refreshed timestamp updates, current value reflects new price

Regression checks:
- Perp panel still renders (shares price hooks + DAL pattern)
- Scratchpad still renders and computes (shares Stage 1 primitives + format utils)
- Settings panel still loads balance + risk% from store

Final step: `git mv docs/backlog/todo.spot-tracker.md docs/backlog/done.spot-tracker.md` in the same PR.
