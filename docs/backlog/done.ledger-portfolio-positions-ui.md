# ledger-portfolio-positions-ui — Portfolio summary + Positions table

**Epic**: ledger · **Phase**: 2 · **Severity**: 🟠 · **Depends on**: ledger-weekly-review-engine, ledger-manual-forms

## Goal

Build the `Portfolio` and `Positions` sub-views so the user can see current exposure, lifetime PnL, withdrawable profit, and per-(account, product) status at a glance.

## Acceptance criteria

- [ ] `Portfolio` sub-view shows aggregate KPIs: total current exposure, total deposited, total withdrawn, lifetime PnL, withdrawable now (sum of `max(0, currentValue - totalDeposited)` per position), cash recovered % (`totalWithdrawn / totalDeposited`), and house-money count (positions with `totalWithdrawn >= totalDeposited`)
- [ ] `Positions` sub-view shows one row per `(accountId, productId)` with: account, product, type (vault/agent), shares held (vault only — `—` for agent), latest share price (vault only), latest equity (agent only), current value, total deposited, total withdrawn, lifetime PnL, withdrawable now, status badge
- [ ] Status badge values: `tp available` · `below principal floor` · `house money` · `missing snapshot` · `stale snapshot` · `no tp` (green / gray / amber / red as appropriate)
- [ ] Account filter and product-type filter (`all` / `vault` / `agent`) at the top of `Positions`; filters affect visible rows only, not aggregate KPIs in `Portfolio`
- [ ] Missing-snapshot rows render an inline `→ add snapshot` link that switches to the `Snapshots` tab pre-filtered to that product
- [ ] All numeric values come from `computeVaultPosition` / `computeAgentPosition` — no UI-side recomputation
- [ ] All KPIs use `Decimal.toFixed(2)` for USDC display; share counts use `toFixed(6)`
- [ ] No `style={{` in any new file
- [ ] No file > 250 lines
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green

## Files touched

**New:**
- `src/features/ledger/portfolio/PortfolioSummary.tsx` — KPI grid
- `src/features/ledger/positions/PositionsTable.tsx` — main table
- `src/features/ledger/positions/PositionStatusBadge.tsx` — typed status → badge mapping
- `src/features/ledger/positions/PositionFilters.tsx` — account + type filters
- `src/data/hooks/useLedgerPositions.ts` — composes transactions + snapshots into `PositionState[]` via `useMemo`
- `src/features/ledger/__tests__/PortfolioSummary.test.tsx` — fixture row totals match
- `src/features/ledger/__tests__/PositionsTable.test.tsx` — fixture row values match; status badge mapping covered

**Edited:**
- `src/features/ledger/views/PortfolioView.tsx` — compose `<PortfolioSummary />`
- `src/features/ledger/views/PositionsView.tsx` — compose `<PositionFilters /> + <PositionsTable />`
- `src/features/ledger/LedgerPanel.tsx` — wire the "→ add snapshot" cross-tab link if it requires lifting tab state up (acceptable)

## Out of scope

- Weekly review table (next spec)
- Profit bank table (later spec)
- CSV import / export
- AI coach explanations (post-MVP)
- Trading actions or withdrawal execution (never in scope)
- Charts (no donut / line yet — keep dense ops layout)

## Implementation notes

- Layout: dense table, no decorative cards-in-cards. Match the visual density of `src/features/perp/PerpPanel.tsx` and `src/features/spot/SpotPanel.tsx`.
- Status badge mapping uses the typed `AccountingWarning` union from `src/domain/accounting/types.ts` — UI consumes warnings, never re-checks conditions.
- Sorting: default by current value descending. Sortable columns: current value, lifetime PnL, withdrawable. Sort state is local (useState).
- Cross-tab links (e.g. "→ add snapshot"): if implementing the link requires the `Snapshots` view to accept a `prefilterProductId` prop, lift the active tab + tab state into `LedgerPanel.tsx`. Don't reach for context.
- Aggregation: do not recompute per-position math in `PortfolioSummary`. Receive `PositionState[]` and reduce.
- Missing-data rows still appear in the table — they're not hidden. The status badge is the indicator.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -Rn "style={{" src/features/ledger/portfolio src/features/ledger/positions   # expect: empty
find src/features/ledger/portfolio src/features/ledger/positions -type f | xargs wc -l | awk '$1 > 250'   # expect: empty
```

Browser smoke (with seeded Golden vault from earlier specs):
- `Portfolio` shows current exposure ≈ 5340.00, total deposited 4000.00, lifetime PnL 1840.00, cash recovered % 12.5%
- `Positions` Golden row: shares 3657.534247 (or similar precision), SP 1.46, current value 5340.00, lifetime PnL 1840.00, status `tp available`
- Add an agent equity snapshot for XAU; XAU row appears with current value = latest equity, status `tp available`
- Remove the latest XAU snapshot → row status changes to `missing snapshot`; clicking `→ add snapshot` opens the `Snapshots` tab
- Filter by `vault` → only Golden row visible; `Portfolio` KPIs unchanged

Regression: adding a transaction in `Transactions` updates both `Portfolio` and `Positions` without a manual refresh.

Final step: rename `docs/backlog/todo.ledger-portfolio-positions-ui.md` → `docs/backlog/done.ledger-portfolio-positions-ui.md`.
