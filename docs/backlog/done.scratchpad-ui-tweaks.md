# scratchpad-ui-tweaks — density + clarity pass on the calculator panel

**Epic**: scratchpad · **Phase**: — · **Severity**: 🟡 · **Depends on**: scratchpad, design-foundation

## Goal

Tighten the scratchpad's footprint and clarity so it reads as a side-rail tool, not a dominant half-screen. Five tweaks: panel width 50% → 33%, leverage as a slider+number, R-targets surface the absolute $ next to price, header chrome (gear icon size, drop the always-on green dot), and an `InfoTooltip` primitive for acronyms (MMR first; LIQ PRICE / LIQ DIST consume it).

## Acceptance criteria

- [ ] **Layout**: at ≥1280px, dashboard grid is `scratchpad col-span-4 row-span-2` + `perp col-span-8` + `spot col-span-4` + `allocation col-span-4`. No horizontal overflow at 1024px (panels may scroll vertically inside; outer grid does not break)
- [ ] **Leverage control**: all three modes (Classic, StopFirst, SizeFirst) render a slider (HTML `<input type="range">`-based primitive) bound to the same `leverage` state as today; range `1–50`, step `1`; pre-set tick labels at `1, 5, 10, 25, 50`; arrow-key + drag both work. The numeric value shown to the right of the slider is a **small editable number badge** (not a separate full-width Input row) — typing in the badge moves the slider thumb and vice versa
- [ ] **R-targets show $**: 1R/2R/3R rows show price + absolute profit on a single row, **inline with a ` · ` separator** (e.g. `0.02800 · +$200.00`). Profit value uses the existing `fmtSigned` helper from `src/lib/format.ts` (no `fmtSignedUsd` needed — `fmtSigned` already returns `+$200.00` / `−$200.00` with the typographic minus). Color logic matches current price (green for valid long, etc.). No `toFixed` in JSX. Empty state remains `—` (single em-dash, no orphan `· +$—`)
- [ ] **Header chrome**: gear icon is 18×18 SVG inside a 28×28 hit-area button (rounded, subtle hover bg); `StatusDot` removed from `App.tsx` header (no replacement — connection status will surface contextually per-panel later)
- [ ] **InfoTooltip primitive**: new `src/ui/InfoTooltip.tsx`, accessible (button + `aria-describedby` + keyboard focus reveal), uses native `title` as fallback but renders a styled popover on hover/focus. No new dependency
- [ ] **Tooltip usage**: `MMR %` label in `SettingsDrawer` gets the tooltip ("Maintenance Margin Rate — the minimum % of position value Binance requires before forced liquidation. 0.5% is the default tier-1 rate."); `liq price` and `liq dist` rows in all three modes get the tooltip explaining the formula in one line and that it uses the configured MMR
- [ ] No file > 250 lines after the change
- [ ] No new runtime dependency added (no `lucide-react`, no `@radix-ui/*` pulled in just for this)
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] `Scratchpad` mode tests still pass; new test for `Slider` primitive (renders, value change fires onChange)
- [ ] Spec renamed `todo.scratchpad-ui-tweaks.md` → `done.scratchpad-ui-tweaks.md` after verification

## Files touched

**New:**
- `src/ui/Slider.tsx` — range input primitive with value display + tick labels
- `src/ui/InfoTooltip.tsx` — accessible (i) tooltip primitive
- `src/ui/__tests__/Slider.test.tsx`

**Edited:**
- `src/App.tsx` — grid columns + remove StatusDot + larger gear (inline SVG)
- `src/App.test.tsx` — drop the assertion that the header renders an element with `role="status"` (the StatusDot it tests for is being removed)
- `src/ui/MetricRow.tsx` — add optional `secondary?: ReactNode` prop, rendered after `value` separated by ` · `; no other shape change
- `src/features/scratchpad/modes/Classic.tsx` — replace leverage Input with Slider; add $ to R-target rows via `MetricRow secondary`; tooltip on liq price/dist
- `src/features/scratchpad/modes/StopFirst.tsx` — same three changes
- `src/features/scratchpad/modes/SizeFirst.tsx` — same three changes
- `src/features/settings/SettingsDrawer.tsx` — tooltip on MMR % label

**Reused (no edit):** `fmtSigned(n, dp)` from `src/lib/format.ts` already returns `+$200.00` / `−$200.00` with the typographic minus — do not add a new helper.

**Renamed:** `docs/backlog/todo.scratchpad-ui-tweaks.md` → `docs/backlog/done.scratchpad-ui-tweaks.md`

## Out of scope

- Touching the perp / spot / allocation panel internals (only their grid `col-span-*` is changing)
- Replacing the gear glyph with an icon library (keep inline SVG; no `lucide-react` install)
- A full Radix/shadcn tooltip — `InfoTooltip` is a hand-rolled minimal popover, not a portal/positioner
- Persisting leverage across reloads, or syncing leverage between modes (existing per-mode local state behavior preserved)
- Mobile / <1024px responsive polish

## Implementation notes

- **Grid**: outer is still `grid grid-cols-12 gap-4`. Scratchpad gets `col-span-4 row-span-2`. The other panels are listed individually (drop the `OTHER_PANELS.map`) so per-panel `col-span-*` is explicit. This unblocks the polish-v1 spec which already plans per-panel work.
- **Slider primitive**: thin wrapper around `<input type="range">` styled with Tailwind. Props: `{ value, onChange, min=1, max=50, step=1, ticks?: number[], suffix?: string }`. To the right, render a **small editable number badge** (a compact `<input type="number">` ~32–40px wide, mono + tabular-nums + `×` suffix) so the user can type an exact value; the badge's onChange flows through the same `onChange` callback the slider uses. Match the hand-rolled style of `Tabs.tsx` / `Button.tsx` — no Radix.
- **Leverage state**: keep `useState<string>` to match other inputs; `<Slider value={parseFloat(leverage) || 10} onChange={(v) => setLeverage(String(v))} />`. Slider thumb mirrors the badge value via the controlled `value` prop, so typing `25` in the badge moves the thumb to 25.
- **R-target $ math**: `1R$ = qty * R`, `2R$ = 2 * qty * R`, `3R$ = 3 * qty * R`. For Classic / StopFirst, `qty * R === riskUsd`, so reuse `riskUsd` (and `2*riskUsd`, `3*riskUsd`). For SizeFirst, `riskUsd` is already the computed `qty * R`. So all three modes use `n * riskUsd`. Compute in the existing compute fn; expose `r1Usd`, `r2Usd`, `r3Usd` on the `Result` type.
- **MetricRow**: currently single value column. Pass a tuple/array or a JSX node. Cleanest: extend `MetricRow` to optionally accept a `secondary` prop (string or node) shown after the primary value with a `·` separator. Keep the prop optional to avoid touching unrelated rows.
- **Header gear**: replace the `⚙` text with an inline SVG (cog, `width=18 height=18 stroke=currentColor strokeWidth=1.5`). Wrap in a `button` with `h-7 w-7 rounded-sm hover:bg-bg-inset` for proper hit-area + affordance. Keep `aria-label="open settings"`.
- **Status dot removal**: just delete the `<StatusDot ... />` line and its import. Don't pre-emptively re-purpose — connection state will be added contextually when a panel actually has fetch failures (polish-v1 covers it).
- **InfoTooltip**: button containing a tiny `(i)` glyph (12px circle SVG or `ⓘ`); renders an absolutely-positioned popover on `:hover` and `:focus-visible`. Use CSS only (no JS positioning) — anchor with `relative` parent, popover `absolute top-full mt-1`. Width capped (`max-w-[220px]`), text-[11px], `bg-bg-1 border border-border-1 rounded-sm px-2 py-1`. `aria-describedby` wires the popover id to the trigger for screen readers.
- **No new deps**: budget pressure here is real — `polish-v1` has the same constraint. Verify `package.json` is unchanged after the work.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -rn "toFixed" src/features/scratchpad src/ui/InfoTooltip.tsx src/ui/Slider.tsx   # expect: no results
grep -rn "StatusDot" src/App.tsx                                                       # expect: no results
git diff package.json                                                                  # expect: no changes
find src/features/scratchpad src/ui/Slider.tsx src/ui/InfoTooltip.tsx -type f -exec wc -l {} \; | awk '$1 > 250'
```

Browser smoke (`yarn dev` at 1280px and 1024px):
- Dashboard renders: scratchpad on the left ~33% wide and tall (spans 2 rows); perp wide on top-right; spot + allocation share the bottom-right row
- Scratchpad: drag leverage slider (range 1–50) — badge updates live; type `25` into the badge — slider thumb jumps to 25
- Switch to each of the three modes — slider present in all; previously typed leverage carries over within a mode
- Enter Classic with balance 10000, risk% 2, entry 100, stop 95, leverage 10 → `1R target` row shows `105.00 · +$200.00`, `2R` shows `110.00 · +$400.00`, `3R` shows `115.00 · +$600.00`
- Set stop above entry while long → R-target rows collapse to `—` (no `+$—`, no `NaN`)
- Hover the (i) on `liq price` → popover appears with the formula explanation; tab into it via keyboard → popover appears on focus too
- Open settings drawer → hover the (i) on `MMR %` label → MMR explanation popover appears
- Click the gear icon — hit area feels comfortable (28×28); icon visible at 18px
- Header has no green dot
- 1024px width: outer grid does not horizontally overflow

Final step: `git mv docs/backlog/todo.scratchpad-ui-tweaks.md docs/backlog/done.scratchpad-ui-tweaks.md`.
