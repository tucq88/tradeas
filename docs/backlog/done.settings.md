# settings — global settings store + drawer

**Epic**: foundation · **Phase**: 3 · **Severity**: 🟡 · **Depends on**: scratchpad

## Goal

Extract the scratchpad's inline `accountBalance` + `riskPct` to a localStorage-backed global settings store, add `mmrPct` (default 0.5%) and `refreshSec` (default 30s) slots for downstream stages, and expose a small Settings drawer to view/edit them. Scratchpad refactors to consume the store instead of holding the values in component state.

## Acceptance criteria

- [ ] Settings shape exactly: `{ accountBalanceUsd: number; riskPct: number; mmrPct: number; refreshSec: number }`
- [ ] Defaults: `accountBalanceUsd: 1000`, `riskPct: 2`, `mmrPct: 0.5`, `refreshSec: 30`
- [ ] Storage key is the literal string `tu.tradeas:settings:v1` (versioned)
- [ ] `src/state/settings.ts` exposes a plain TS store + `useSettings()` hook returning `[settings, update]`; module has zero React imports apart from the hook itself
- [ ] Defaults survive a hard reload when localStorage is empty
- [ ] After editing risk% in the drawer, closing it, and reloading, the drawer reopens with the edited value AND the scratchpad reflects the same value
- [ ] Scratchpad mode tests (Classic, Stop-first, Size-first) still pass after the refactor — no math regressions
- [ ] Settings drawer is mounted from the dashboard shell (right-rail drawer); opens/closes via a header gear/settings affordance
- [ ] Invalid persisted JSON (corrupted localStorage) falls back to defaults silently — no crash on boot
- [ ] No file > 250 lines
- [ ] No Supabase calls introduced in this stage (`grep -r "supabase" src/state src/features/settings` returns nothing)
- [ ] No React Context provider chain > 1 file deep (store is module-level singleton + hook; no Provider component required)
- [ ] `src/state/settings.ts` has no `from 'react'` imports apart from `useSyncExternalStore`/`useState` inside the hook section — the store itself is plain TS
- [ ] Spec file renamed `todo.settings.md` → `done.settings.md` after all checks pass

## Files touched

**New:**
- `src/state/settings.ts` — store (subscribe/getSnapshot/update + load/save against `tu.tradeas:settings:v1`) and `useSettings()` hook
- `src/features/settings/SettingsDrawer.tsx` — right-rail drawer UI: 4 number inputs (balance, risk%, MMR%, refresh sec) + close button; reads/writes via `useSettings`
- `src/state/__tests__/settings.test.ts` — covers: defaults when storage empty, round-trip persistence, malformed JSON falls back to defaults, partial object merges with defaults, storage key is exactly `tu.tradeas:settings:v1`

**Edited:**
- `src/features/scratchpad/Scratchpad.tsx` — drop the local `useState` for balance + risk%; read both from `useSettings()`; remove the inline inputs (now lived inside the drawer) OR keep them as bound passthroughs to `update()` — pick one in implementation, do not duplicate state
- `src/App.tsx` (or whichever file owns the dashboard shell after `design-foundation`) — mount `<SettingsDrawer />` and a trigger button in the header

## Out of scope

- Supabase sync of settings (deferred; localStorage is source of truth for v1)
- Wiring `refreshSec` into actual price refresh loops (Stage 4 consumes it)
- Wiring `mmrPct` into liquidation math (Stage 7 consumes it; Stage 2 already takes MMR as a function arg, no change needed here)
- Per-asset / per-position MMR overrides
- Multi-profile settings, import/export, reset-to-defaults button (can be added later)
- Theming, density, locale, currency switch

## Implementation notes

- Use `useSyncExternalStore` so the hook stays trivial and SSR-safe-ish; subscribers list lives in the module. No Zustand/Jotai dep — keep it dependency-free.
- `loadFromStorage()` must `try/catch` `JSON.parse`; on any error, return defaults (do not write). On valid load, **shallow-merge over defaults** so a future field added to the shape doesn't blow up old payloads.
- `update(patch)` accepts `Partial<Settings>`; merges, persists, notifies. Do not expose the raw setter.
- Drawer styling: follow `docs/design/ui_kits/dashboard/primitives.jsx` — use the existing `Panel` look or a fixed right-side overlay; numeric inputs use `inputMode="decimal"`, tabular-nums.
- Scratchpad refactor: the inline "Account balance" + "Risk %" controls in the scratchpad header move INTO the drawer. Scratchpad still displays the current values (read-only label) so the user knows what risk% is being applied — but the only edit point is the drawer. This avoids two stateful inputs racing each other.
- Test the storage key string with a literal assertion in `settings.test.ts` so a typo bumping the key silently is caught.
- Mock `localStorage` in vitest via `jsdom` (already configured in bootstrap); each test should `localStorage.clear()` in `beforeEach`.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

Grep checks (must return nothing):

```bash
grep -rn "useState.*balance\|useState.*risk" src/features/scratchpad   # state moved to store
grep -rn "supabase" src/state src/features/settings                    # no Supabase this stage
grep -rn "createContext" src/state src/features/settings               # no Context provider
grep -rn "tu\.tradeas:settings:v[02-9]" src                            # only v1 in source
```

Grep check (must match exactly once in `src/state/settings.ts`):

```bash
grep -c "tu.tradeas:settings:v1" src/state/settings.ts                 # → 1
```

Manual browser smoke (`yarn dev`):

1. Fresh load with empty localStorage → scratchpad shows balance 1000, risk 2%.
2. Open settings drawer (header gear) → all four fields visible with defaults.
3. Change risk% to `5`, change balance to `2500`, close drawer.
4. Scratchpad immediately reflects 5% risk on a 2500 balance (Stop-first / Classic numbers update).
5. Hard reload (Cmd+Shift+R) → drawer reopens with 5 / 2500 still set; scratchpad still uses them.
6. In DevTools → Application → Local Storage, confirm key is `tu.tradeas:settings:v1` and value parses to the full 4-field object.
7. Edge case: in DevTools, set the value to invalid JSON (`{`), reload → no crash, drawer falls back to defaults.

Regression checks:

- Scratchpad Classic / Stop-first / Size-first numeric outputs match pre-refactor for the same inputs (compare against unit tests from Stage 2).
- No console errors on mount, drawer open, drawer close, or reload.

Final step: `git mv docs/backlog/todo.settings.md docs/backlog/done.settings.md` in the same PR.
