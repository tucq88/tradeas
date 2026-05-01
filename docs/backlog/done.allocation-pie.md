# allocation-pie — donut chart of WIP spot holdings

**Epic**: allocation · **Phase**: 8 · **Severity**: 🟡 · **Depends on**: spot-tracker

## Goal

Render the 4th dashboard panel as a donut chart derived from spot WIP holdings × current mark price, with hover/click → asset detail tooltip and accent-highlighted selected slice. Empty state when zero WIP lots. No new aggregation logic — reuse the spot tracker's per-asset aggregator.

## Acceptance criteria

- [ ] `AllocationPanel` mounts in the 4th panel slot of the dashboard shell
- [ ] Donut data shape: `[{ asset, currentValue, pctOfBook, unrealizedPnl }]`, derived from WIP lots only via the existing `aggregate.ts` exports (no recompute)
- [ ] Slices sorted by `currentValue` desc; colors cycle through a fixed 6–8 muted-hue palette defined as tokens
- [ ] Hover OR click on a slice surfaces a tooltip with `asset`, `currentValue` (USD, thousands separator), `pctOfBook` (one decimal, e.g. `42.7%`), and `unrealizedPnl` with signed delta (`−` not `-`)
- [ ] Click-to-select: selected slice swaps its fill to `var(--accent)` regardless of base palette color; clicking the same slice again (or empty space) clears selection
- [ ] Empty state renders placeholder copy when there are zero WIP lots — no broken zero-radius arcs or NaN
- [ ] Legend lists each asset with its color swatch, name, % of book, and current value (mirrors reference layout)
- [ ] No file > 250 lines
- [ ] No `style={{` for color overrides outside the palette token application
- [ ] Spec renamed `todo.allocation-pie.md` → `done.allocation-pie.md` after all checks pass

## Files touched

**New:**
- `src/features/allocation/AllocationPanel.tsx` — panel shell, header total, legend, hosts `<DonutChart/>`, owns selection state
- `src/features/allocation/DonutChart.tsx` — pure SVG donut renderer; props: `slices`, `selectedAsset`, `onSelect`, `onHover`
- `src/features/allocation/palette.ts` — fixed 6–8 muted-hue palette token names + `assignColor(asset, index)` helper
- `src/features/allocation/__tests__/donut-data.test.ts` — unit test verifying donut-data shape from a mocked aggregate

**Edited:**
- `src/styles/tokens.css` — add `--alloc-1` … `--alloc-8` muted-hue palette CSS vars
- `src/App.tsx` (or current dashboard shell) — wire `AllocationPanel` into the 4th grid slot

**Renamed:** `docs/backlog/todo.allocation-pie.md` → `docs/backlog/done.allocation-pie.md`

## Out of scope

- Recomputing per-asset aggregation (must import from `src/features/spot/aggregate.ts`)
- Closed/Done lots (donut is WIP only — realized PnL lives in spot tracker)
- Fallback hex colors anywhere (palette is tokens, selected is `--accent`)
- Stage 9 trade-notes integration (no slice → notes link)
- Stage 10 polish (refresh-all, density audit, etc.)
- Allocation targets / rebalancing UI (deferred per `CLAUDE.md`)
- Recharts unless SVG-primitive proves insufficient (see Implementation notes)

## Implementation notes

- **Library choice**: prefer hand-rolled SVG primitives — a donut is two `<path>` arcs per slice (`d="M ... A ... A ..."`) and avoids adding a chart dep. Document this decision at the top of `DonutChart.tsx`. If the hover/tooltip math gets gnarly, fall back to `recharts` and **note it as a new dependency in this spec before adding** (update `## Files touched` and acceptance criteria).
- **Data source**: import the same per-asset aggregator the spot tracker uses (`src/features/spot/aggregate.ts`). Filter for WIP holdings, then map to `{ asset, currentValue, pctOfBook, unrealizedPnl }`. Total book = sum of `currentValue`.
- **Selection state** lives in `AllocationPanel` (single `selectedAsset: string | null`). Hover state is local to `DonutChart`. Tooltip prefers selected over hovered when both are set.
- **Color application**: pass `var(--alloc-N)` strings into the SVG `fill` attribute via the `assignColor` helper. Selected slice fill is hard-swapped to `var(--accent)` in the render path — no opacity dimming of others (keep it crisp).
- **Empty state**: when `slices.length === 0`, render the panel chrome (title + total `$0`) and a centered fg-3 placeholder ("no WIP lots yet — add a lot in spot tracker"). Do not mount the SVG.
- **Number formatting**: reuse `src/lib/format.ts` (USD, signed delta, percent with one decimal) — no raw `toFixed` in this feature.
- **Reference layout** at `docs/design/ui_kits/dashboard/Allocation.jsx` is a stacked bar; this stage upgrades to a donut but keeps the same legend rows + total header.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

All four green. Then:

```bash
grep -rE "from ['\"]\\.\\./spot/aggregate" src/features/allocation/   # confirms reuse, not recompute
grep -rE "fill=\"#" src/features/allocation/                          # must return nothing (no hex)
grep -rE "style=\\{\\{" src/features/allocation/                      # only palette token application allowed
```

Unit test: `donut-data.test.ts` mocks the aggregate output and asserts shape + sort + `pctOfBook` rounding.

Browser smoke (`yarn dev`):
1. Seed spot tracker with WIP BTC + ETH lots → allocation panel shows two slices, total = sum, legend lists both
2. Hover BTC slice → tooltip shows `BTC`, correct USD value, `pctOfBook` to one decimal, signed unrealized PnL
3. Click BTC slice → fill swaps to accent cyan-blue; click again → clears selection
4. Mark all WIP lots Done in spot tracker → allocation panel shows empty placeholder copy, no broken SVG

Regression: spot tracker still renders WIP/Done sections correctly (allocation must not mutate spot state).

Final step: `git mv docs/backlog/todo.allocation-pie.md docs/backlog/done.allocation-pie.md` in the same PR.
