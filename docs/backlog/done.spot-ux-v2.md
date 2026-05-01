# spot-ux-v2 — spot panel UX overhaul

**Epic**: spot · **Phase**: 9a · **Severity**: 🔴 · **Depends on**: spot-tracker, allocation-pie

## Goal

Fix the spot panel's overflow problem and improve the core DCA workflow: wider layout, WIP/Realized tabs, symbol validation before save, collapsible asset groups, token logos, integer PnL, smarter lot form with auto-calculation, and column headers on the lot list.

## Acceptance criteria

- [ ] **Layout**: `App.tsx` grid changes to `scratchpad col-span-4 row-span-3`; spot `col-span-8`; allocation `col-span-8` (own row 3); no panel overflows at 1280px
- [ ] **Tabs**: `SpotPanel` has two tabs (`wip` · `realized`) using the existing `src/ui/Tabs.tsx` primitive; default is `wip`; realized section is removed from the WIP view
- [ ] **Token logos**: `src/ui/TokenLogo.tsx` renders `<img>` from CoinCap CDN (`https://assets.coincap.io/assets/icons/{symbol}@2x.png`) with a letter-circle fallback on `onError`; used in `AssetAggregation` header and `AllocationPanel` legend; no new npm dep
- [ ] **Symbol validation**: `LotForm` validates the asset symbol on `onBlur` via `getSpotPrice(toBinancePair(asset))`; on `BinanceError(kind='unknown-symbol')` shows inline error and blocks submit; same guard in `LotRow` edit mode
- [ ] **Collapsible groups**: each asset group in the WIP tab has a collapse/expand toggle (▾/▸ text char); state in `SpotPanel` as `Set<string>`; default expanded; collapsed state hides `LotRow` children, keeps `AssetAggregation` header visible
- [ ] **PnL integers**: all PnL display calls use `fmtSigned(n, 0)` and `fmtUSD(pnl, 0)`; invested / cost / price fields keep their current precision; affects `AssetAggregation`, `RealizedSummary`, `PositionRow` (perp), `DonutChart` tooltip
- [ ] **LotForm field order**: `date → asset → entry_price → amount → cost_usd`; when `amount` changes and `entry_price` is valid → auto-set `cost_usd = amount × entry_price`; when `cost_usd` changes → auto-set `amount = cost_usd / entry_price`; when `entry_price` changes → recompute `cost_usd` if `amount` is non-empty; both fields remain editable
- [ ] **Lot list headers**: a header row (`DATE · AMOUNT · ENTRY · COST`) appears above the first asset group in the WIP tab using `label-caps` styling
- [ ] No file > 250 lines; no `style={{` in new files; no new npm dependencies
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] Spec renamed `todo.spot-ux-v2.md` → `done.spot-ux-v2.md` after all checks pass

## Files touched

**New:**
- `src/ui/TokenLogo.tsx` — logo img + letter-circle fallback
- `src/ui/__tests__/TokenLogo.test.tsx` — renders symbol, shows fallback on error

**Edited:**
- `src/App.tsx` — scratchpad `row-span-3`; spot `col-span-8`; allocation `col-span-8` (row 3)
- `src/features/spot/SpotPanel.tsx` — add tabs, collapsible state, lot headers, remove inline realized
- `src/features/spot/LotForm.tsx` — reorder fields, auto-calc amount/cost, symbol validation
- `src/features/spot/LotRow.tsx` — symbol validation in edit mode
- `src/features/spot/AssetAggregation.tsx` — collapse toggle prop, TokenLogo, PnL integer
- `src/features/spot/RealizedSummary.tsx` — PnL integer
- `src/features/perp/PositionRow.tsx` — PnL integer (unrealized + realized)
- `src/features/allocation/AllocationPanel.tsx` — TokenLogo in legend
- `src/features/allocation/DonutChart.tsx` — PnL integer in tooltip

## Out of scope

- Global refresh button (polish-v1)
- Format audit / toFixed sweep (polish-v1)
- Scratchpad validation (polish-v1)
- 1024px density (polish-v1)
- Trade notes / journal integration (next spec)
- CSV export, auth, RLS

## Implementation notes

- **Tab state** lives in `SpotPanel`; use the existing `Tabs` primitive from `src/ui/Tabs.tsx` — no new tab component
- **TokenLogo**: `<img src={...} width={size} height={size} alt={symbol} onError={showFallback} />`; fallback is a `<span>` circle with `bg-bg-3`, centered first letter; keep the component ≤ 30 lines
- **Symbol validation**: import `getSpotPrice` from `@/data/binance/spot` and `BinanceError` from `@/data/binance/errors`; only flag `kind === 'unknown-symbol'`; network errors (fetch failure) are silently ignored so offline users aren't blocked
- **Auto-calc**: track `lastEdited: 'amount' | 'cost' | null` in form state; use it to decide which field to recompute when `entry_price` changes; display auto-computed values as strings rounded to 6dp (amount) / 2dp (cost)
- **Collapse state**: `const [collapsed, setCollapsed] = useState<Set<string>>(new Set())`; `AssetAggregation` receives `isCollapsed: boolean` + `onToggle: () => void`
- **PnL integer**: `fmtSigned(n, 0)` already works — `dp=0` rounds to nearest dollar; do not add a new helper

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

Browser smoke:
- Spot panel is as wide as perp panel; no horizontal overflow
- WIP tab: form entry order correct; type amount → cost fills in; type cost → amount fills in
- Type "BTCASD" in asset field, blur → inline error appears, add lot button disabled
- Asset group with 2+ lots: click ▾ → lots hidden, click ▸ → lots shown
- Token logo appears next to BTC/ETH; fallback letter circle for unknown tokens
- PnL values everywhere show whole dollars (no cents)
- Realized tab: shows realized PnL history; WIP tab has no realized section
- Allocation panel on row 3 still works; donut + legend intact

Regression: perp panel, scratchpad, allocation donut all still render correctly.

Final step: rename `docs/backlog/todo.spot-ux-v2.md` → `docs/backlog/done.spot-ux-v2.md`.
