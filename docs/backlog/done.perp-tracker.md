# perp-tracker — persisted perp position tracker panel

**Epic**: perp · **Phase**: 7 · **Severity**: 🔴 · **Depends on**: settings, prices-binance, data-supabase

## Goal

Persisted perp positions panel: create/edit/close rows (symbol, direction, entry_price, leverage, size_usdt), with live Binance mark price driving unrealized PnL, liq price, and liq distance %. Reuses scratchpad's `src/lib/liq.ts` so the dashboard and the calculator never disagree.

## Acceptance criteria

- [ ] `PerpPanel` lists open positions (status='open') with columns: symbol, side+lev, entry, mark, size, pnl ($ + %), liq dist %; matches `docs/design/ui_kits/dashboard/Positions.jsx` layout via existing `src/ui/` primitives
- [ ] `PositionForm` creates rows with fields: symbol, direction (long|short), entry_price, leverage, size_usdt, optional mmr_override; persists via `perpPositions.create` from Stage 5 DAL
- [ ] Edit flow updates the same fields on an open row
- [ ] `CloseDialog` requires `exit_price` (numeric, >0) — submit disabled when empty/invalid; on confirm sets `status='closed'`, `closed_at=now()`, `exit_price`; row leaves the open list
- [ ] Realized PnL shown for closed positions (separate closed list/section, newest first)
- [ ] Mark prices via `useMarkPrices(symbols[])` from Stage 4; manual refresh control updates PnL + liq distance live (no reload)
- [ ] Effective MMR per row = `mmr_override ?? settings.mmrDefault` (Stage 3 store, default 0.5%)
- [ ] Liq distance cell renders amber (`tt-warn` token) when `Math.abs(liqDistancePct) <= 0.10`
- [ ] Empty state ("no open positions") when zero rows; loading + error states surfaced per panel
- [ ] No file > 250 lines
- [ ] No scratchpad calculator UI in this panel; no spot logic in this panel
- [ ] No duplication of the liq formula — must `import { liqPrice } from '@/lib/liq'`
- [ ] Spec renamed `todo.perp-tracker.md` → `done.perp-tracker.md` after all checks pass

## Files touched

**New:**
- `src/features/perp/PerpPanel.tsx` — panel shell, list + refresh + open/closed sections
- `src/features/perp/PositionRow.tsx` — single row, derives mark/pnl/liq via `compute.ts`
- `src/features/perp/PositionForm.tsx` — create/edit form
- `src/features/perp/CloseDialog.tsx` — close flow with exit_price guard
- `src/features/perp/compute.ts` — pure derivations: `unrealizedPnl`, `realizedPnl`, `liqDistancePct`, `effectiveMmr`, `isLiqWarn`
- `src/features/perp/__tests__/compute.test.ts` — unit tests (long, short, edge MMR, edge leverage)
- `supabase/migrations/0002_perp_mmr.sql` — backward-compatible `ALTER TABLE perp_positions ADD COLUMN mmr_override numeric NULL` (only if Stage 5 schema didn't already include it)

**Edited:**
- `src/App.tsx` (or dashboard shell) — mount `<PerpPanel />` in the perp slot

## Out of scope

- Tier-based MMR tables (single override + global default only)
- Cross margin (CLAUDE.md mandates isolated margin)
- Funding fees, taxes, fee accounting
- WebSocket streaming of mark price (deferred per CLAUDE.md)
- Copy-paste import from exchanges (deferred)
- Trade notes attachment (Stage 9)
- Allocation/pie integration (Stage 8)

## Implementation notes

- **Reuse, don't redefine.** `liqPrice(direction, entry, leverage, mmr)` lives in `src/lib/liq.ts` from Stage 2; import it. `compute.ts` only adds the perp-row-specific derivations.
- Formulas (transcribe exactly into `compute.ts`):
  - Liq long: `entry * (1 - 1/leverage + mmr)`
  - Liq short: `entry * (1 + 1/leverage - mmr)`
  - Liq distance %: long → `(markPrice - liqPrice) / markPrice`; short → `(liqPrice - markPrice) / markPrice`
  - Unrealized PnL (USD): `direction === 'long' ? (markPrice - entry) * (size_usdt * leverage / entry) : (entry - markPrice) * (size_usdt * leverage / entry)`
  - Realized PnL on close: same shape, swap `markPrice` → `exit_price`
  - Liq amber threshold: `Math.abs(liqDistancePct) <= 0.10`
- MMR resolution: `effectiveMmr(row, settings) = row.mmr_override ?? settings.mmrDefault`. Do not silently fall back to a hardcoded 0.005 inside `compute.ts` — settings must be passed in.
- Mark price hook returns `Map<symbol, number>`; row derivations must handle "price not yet loaded" (render `—` for mark/pnl/liq dist, no warning paint until mark resolves).
- Close flow: keep `exit_price` validation in the dialog (form-level), not in the DAL — DAL stays dumb.
- Migration: only add `0002_perp_mmr.sql` if the Stage 5 `perp_positions` table doesn't already have `mmr_override`. If it does, this stage edits no SQL.
- Order of operations: schema migration first (if needed) → `compute.ts` + tests → `PositionForm` → `PerpPanel` wiring → `CloseDialog` → row warning paint last.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

All green. Then:

```bash
grep -rE "1 *- *1 */ *leverage" src/features/perp 2>/dev/null   # must be empty: formula belongs only in src/lib/liq.ts
grep -rE "1 *\+ *1 */ *leverage" src/features/perp 2>/dev/null  # must be empty
grep -rE "from ['\"]@/lib/liq['\"]" src/features/perp            # must show compute.ts (and possibly PositionRow) importing it
find src/features/perp -type f -name '*.ts*' -exec wc -l {} \;   # every file ≤ 250 lines
```

Unit tests in `__tests__/compute.test.ts` must cover: long open profit, long open loss, short open profit, short open loss, MMR override vs default, leverage edge (e.g. 1x and 100x), liq distance amber boundary at exactly 10%.

Manual browser smoke (golden + edges):
- Create long BTCUSDT @ 50x, size 100 USDT, entry near current mark → row appears, mark populates after refresh, liq price + liq distance % render, amber paints when distance ≤ 10%
- Create short ETHUSDT @ 10x → liq above entry, distance computed against mark
- Edit a row's leverage → liq price + distance recompute on next render
- Close a position with empty exit_price → submit blocked; with valid exit_price → row moves to closed list with realized PnL
- Refresh button → mark prices and PnL update without page reload

Regression check (shared state with Stage 2):
- Open scratchpad Mode 1 with the same inputs (entry, leverage, MMR) → liq price matches the perp row's liq price exactly. Any drift means `src/lib/liq.ts` was duplicated and must be deleted.

Final step: rename `docs/backlog/todo.perp-tracker.md` → `docs/backlog/done.perp-tracker.md`.
