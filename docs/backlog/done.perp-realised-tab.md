# perp-realised-tab — Realised tab for closed perp trades

**Epic**: perp · **Phase**: — · **Severity**: 🟠 · **Depends on**: done.perp-tracker

## Goal

Mirror the spot WIP/Realized tab pattern on the perp panel: replace the inline closed-positions section with a proper `Realized` tab that shows a flat list of closed trades plus a summary strip (total PnL, win rate, count, avg, best/worst). Funding fees ignored, all-or-nothing closes only.

## Acceptance criteria

- [ ] Perp panel renders two tabs `Open` and `Realized` using shared `Tabs` (`src/ui/Tabs.tsx`); `Open` is default.
- [ ] `Open` tab content matches today's panel exactly: positions table + `+ Add Position` form, no behavioral change.
- [ ] `Realized` tab content lives in a new `PerpRealizedSummary` component and shows:
  - Summary strip: `Total PnL`, `Win rate`, `N trades`, `Avg`, `Best`, `Worst`
  - Flat table sorted by `closed_at` desc with columns: `Symbol · Side · Lev · Size · Entry · Exit · PnL · ROI% · Closed`
- [ ] Empty state on Realized tab when no closed trades: `no realized trades yet`.
- [ ] Realised PnL per row is computed via the existing `realizedPnl()` from `src/features/perp/compute.ts` — no formula duplication.
- [ ] Per-row ROI = `pnl / size_usdt` (ROI on isolated margin).
- [ ] PnL/ROI use `text-profit` / `text-loss` color tokens consistent with spot Realized tab.
- [ ] Inline `ClosedSection` function in `PerpPanel.tsx` is fully removed; `grep -n "ClosedSection" src/` returns empty.
- [ ] No file > 250 lines.
- [ ] Spec renamed `todo.perp-realised-tab.md` → `done.perp-realised-tab.md` after all checks pass.

## Files touched

**New:**
- `src/features/perp/aggregate.ts` — `summarizeClosed(positions: PerpPosition[]): ClosedSummary`
- `src/features/perp/PerpRealizedSummary.tsx` — summary strip + flat table
- `src/features/perp/__tests__/aggregate.test.ts` — unit tests for `summarizeClosed`

**Edited:**
- `src/features/perp/PerpPanel.tsx` — add `Tabs`, gate Open content, render `PerpRealizedSummary` in Realized tab, remove inline `ClosedSection` and now-unused `realizedPnl`/`fmtUSD`/`fmtPrice` imports

## Out of scope

- Funding fee tracking
- Partial closes / scaling out
- Per-symbol grouping or filtering on the Realized tab
- Editing closed trades (exit price corrections)
- CSV export of realised trades

## Implementation notes

- Reuse `realizedPnl()` from `src/features/perp/compute.ts:17` — direction-aware (long/short) already handled there.
- `aggregate.ts` should defensively skip rows where `realizedPnl()` returns null (i.e. `exit_price == null`).
- `summarizeClosed` returns:
  ```ts
  {
    rows: { position, pnl, roi }[];
    totalPnl, avgPnl, bestPnl, worstPnl: number;
    count, wins, losses: number;
    winRate: number; // 0..1, 0 when count === 0
  }
  ```
- `bestPnl`/`worstPnl`/`avgPnl` undefined when count === 0 — return 0 to keep consumers number-typed; rely on `count === 0` empty-state branch in the component.
- Sort `rows` by `closed_at` desc; null `closed_at` falls to the bottom (shouldn't occur in practice, but keep stable).
- Tab pattern to copy: `src/features/spot/SpotPanel.tsx:17-24,76,108-115`.
- Component shape to mirror: `src/features/spot/RealizedSummary.tsx` (typography, border-top divider, color tokens, label-caps).
- `Card` `count` prop stays as `open.length` (matches spot showing WIP count).
- The win-rate denominator is `count` (closed trades). Break-even (PnL == 0) counts as neither win nor loss; document this in the test.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

All green. Then:

```bash
grep -n "ClosedSection" src/                                # must be empty
grep -rE "(exit_price - entry|entry - exit_price)" src/features/perp/aggregate.ts   # must be empty — formula stays in compute.ts
find src/features/perp -type f -name '*.ts*' -exec wc -l {} \;  # every file ≤ 250 lines
```

Unit tests in `__tests__/aggregate.test.ts` must cover:
- Empty input → count 0, winRate 0, all stats 0, rows []
- One winning long, one losing short → winRate 0.5, totalPnl = sum, best > 0, worst < 0
- Break-even trade (exit == entry) → counted in `count`, not in wins or losses
- Position with `exit_price == null` is skipped
- Rows sorted by `closed_at` desc

Manual browser smoke (golden + edges):
- Open dashboard → perp panel shows `Open` and `Realized` tabs; `Open` is default and matches prior layout.
- Add a new position, click `Close`, enter exit price → close flow works as today.
- Switch to `Realized` tab → newly closed trade appears at top of list with correct PnL sign and ROI%.
- Manually verify summary strip: total = sum of PnL column; win rate matches wins/count.
- Realized tab with zero closed trades → shows empty state, no crash.
- Short trade with exit < entry → PnL positive (direction-aware reuse confirmed).

Regression checks:
- Open positions table unchanged: same columns, same `Close` button, same liq/PnL recompute on refresh button.
- Spot panel untouched (no accidental cross-imports from `features/spot` in perp changes).
- Scratchpad untouched.

Final step: rename `docs/backlog/todo.perp-realised-tab.md` → `docs/backlog/done.perp-realised-tab.md`.
