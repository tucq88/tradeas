# scratchpad — pre-trade calculator panel (3 modes + liq util)

**Epic**: scratchpad · **Phase**: 2 · **Severity**: 🟠 · **Depends on**: design-foundation

## Goal

Build the pre-trade calculator panel with three modes (Classic, Stop-first, Size-first) behind an extensible mode-registry, plus a pure isolated-margin liquidation util reusable later by the perp tracker. Nothing persisted; account balance + risk% live as inline panel state for now (extracted to settings in Stage 3).

## Acceptance criteria

- [ ] Panel renders inside the dashboard's calculator slot with a mode segmented control showing all three modes; switching modes swaps the input/output fields
- [ ] Long/short side toggle present and affects liq math + R:R direction
- [ ] Inline `account balance` (USD) and `risk %` (default 2%) inputs visible at the top of the panel; values are React state only — no localStorage, no Supabase, no settings store import
- [ ] **Mode 1 (Classic)** inputs: side, entry, stop, leverage, account balance, risk% → outputs: position size (USDT notional + base qty), liq price, liq distance %, targets at 1R / 2R / 3R
- [ ] **Mode 2 (Stop-first)** inputs: side, market entry, stop, leverage, account balance, risk% → outputs: max safe size for risk%, R/R targets at 1R/2R/3R, liq price, liq distance %
- [ ] **Mode 3 (Size-first)** inputs: side, entry, stop, leverage, fixed size USDT → outputs: actual $ risk, R/R breakdown at 1R/2R/3R, liq price, liq distance %
- [ ] Mode registry: `src/features/scratchpad/registry.ts` exports an array of `{ id, label, component }` entries; `Scratchpad.tsx` renders from the registry. Adding a 4th mode = create one file in `modes/` and append one line to `registry.ts`
- [ ] All computations are live (recompute on every keystroke); invalid inputs (NaN, ≤0, stop on wrong side of entry) produce a `—` placeholder, not `NaN` / `Infinity`
- [ ] `src/lib/liq.ts` exports `liqPrice({ entry, leverage, side, mmr })` and `liqDistancePct({ entry, liq })`; pure functions, no React, no DOM, no fetch, no globals
- [ ] Default MMR = `0.005` exported as `DEFAULT_MMR` from `liq.ts`
- [ ] Unit tests for `liq.ts` cover long, short, several leverages, and zero/invalid leverage edge case
- [ ] Unit tests for each mode's compute fn assert the documented golden numbers below
- [ ] No file > 250 lines; `liq.ts` has no React/DOM/fetch imports
- [ ] No persistence: `grep -r "localStorage\|supabase" src/features/scratchpad src/lib/liq.ts` returns nothing
- [ ] Spec file renamed `todo.scratchpad.md` → `done.scratchpad.md` after all checks pass

## Files touched

**New:**
- `src/lib/liq.ts` — pure isolated-margin liq price + distance
- `src/lib/__tests__/liq.test.ts`
- `src/features/scratchpad/Scratchpad.tsx` — panel shell, mode segmented control, side toggle, balance + risk% inputs, renders active mode component
- `src/features/scratchpad/registry.ts` — `MODES: Mode[]` array
- `src/features/scratchpad/modes/classic.ts` — Mode 1 compute fn + UI
- `src/features/scratchpad/modes/stopFirst.ts` — Mode 2
- `src/features/scratchpad/modes/sizeFirst.ts` — Mode 3
- `src/features/scratchpad/__tests__/modes.test.ts`

**Edited:**
- `src/App.tsx` (or dashboard shell from Stage 1) — mount `<Scratchpad />` in the calculator panel slot

**Renamed:** `docs/backlog/todo.scratchpad.md` → `docs/backlog/done.scratchpad.md`

## Out of scope

- Persisting balance / risk% / MMR (Stage 3 — settings)
- Live Binance prices in the panel (Stage 4)
- Saving a calculated trade as a perp position (Stage 7)
- Fee estimation (placeholder UI only — no real fee math this stage)
- Tier-aware MMR; we ship a single default constant and let the perp tracker layer per-position overrides later
- Mobile / narrow-viewport polish

## Implementation notes

- **Liq formulas (Binance isolated, exact):**
  - Long: `liq = entry × (1 - 1/leverage + MMR)`
  - Short: `liq = entry × (1 + 1/leverage - MMR)`
  - Default MMR: `0.005` (0.5%)
  - `liqDistancePct = |entry - liq| / entry × 100`
- **R-multiple math:** `R = |entry - stop|`; for a long, target_n = `entry + n×R`; for a short, target_n = `entry - n×R`. Compute 1R/2R/3R uniformly across all modes.
- **Mode 1 size:** `risk_usd = balance × risk%`; `qty = risk_usd / |entry - stop|`; `notional = qty × entry`. Reject if `qty ≤ 0` or stop is on wrong side.
- **Mode 2 max safe size:** identical to Mode 1's qty/notional derivation but framed as a safety check; surface notional, qty, and the implied margin (`notional / leverage`).
- **Mode 3 actual risk:** `qty = sizeUsdt / entry`; `risk_usd = qty × |entry - stop|`; `risk_pct_of_balance = risk_usd / balance × 100`.
- **Validation guard:** wrong-side stop = (long && stop ≥ entry) || (short && stop ≤ entry). When true, every output is `—`.
- **Mode registry shape:** `type Mode = { id: 'classic' | 'stopFirst' | 'sizeFirst'; label: string; Component: React.FC<ScratchpadCtx> }` where `ScratchpadCtx = { side, balance, riskPct }`. New modes append; nothing else changes.
- **Layout reference:** `docs/design/ui_kits/dashboard/Calculator.jsx` — segmented mode control, long/short toggle, two-column field grid, summary block. Translate JSX → TSX, replace ad-hoc classes with Stage 1 primitives (`Card`, `Input`, `Tabs`, `MetricRow`, `Badge`).
- **Number formatting:** reuse Stage 1's `format.ts` helpers (USD, percent, signed delta with `−`); never raw `toFixed` in JSX.
- **Golden numbers (for tests):** Mode 1 — balance 10000, risk% 2, side long, entry 100, stop 95, leverage 10, MMR 0.005 → risk_usd 200, qty 40, notional 4000, liq 90.5, 1R 105, 2R 110, 3R 115. Mode 3 — sizeUsdt 5000, entry 100, stop 95, side long → qty 50, risk_usd 250.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

All four green.

Grep checks (must return nothing):

```bash
grep -r "localStorage" src/features/scratchpad src/lib/liq.ts 2>/dev/null
grep -r "supabase" src/features/scratchpad src/lib/liq.ts 2>/dev/null
grep -rE "from ['\"]react" src/lib/liq.ts 2>/dev/null
grep -rE "fetch\(|XMLHttpRequest|window\." src/lib/liq.ts 2>/dev/null
find src/features/scratchpad src/lib/liq.ts -type f -exec wc -l {} \; | awk '$1 > 250'
```

Unit tests:
- `liq.test.ts` — long/short at leverage 1, 5, 10, 25 with MMR 0.005; zero/negative leverage returns `NaN` (or throws — pick one and assert)
- `modes.test.ts` — each mode hits its golden-numbers row above; wrong-side-stop case returns the documented invalid-output sentinel

Manual browser smoke (`yarn dev`):
- Calculator panel renders in the dashboard grid; default mode = Classic
- Click each mode tab → field set + outputs swap; previously-typed numbers reset cleanly between modes (or persist — pick in spec; default: reset)
- Toggle long ↔ short → liq price moves to the correct side of entry; targets flip direction
- Type entry 100, stop 95, leverage 10, balance 10000, risk% 2 (Mode 1) → see qty 40, notional $4,000, liq 90.5, 1R 105, 2R 110, 3R 115 live
- Set stop above entry while long → all outputs collapse to `—`, no `NaN`
- Adjacent regression: Stage 1 dashboard shell still renders all four panels; number formatting (`tabular-nums`) intact across the page

Final step: `git mv docs/backlog/todo.scratchpad.md docs/backlog/done.scratchpad.md` in the same PR as the implementation.
