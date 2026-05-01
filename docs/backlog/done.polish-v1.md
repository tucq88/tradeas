# polish-v1 — cross-cutting cleanup before v1 done

**Epic**: polish · **Phase**: 10 · **Severity**: 🟡 · **Depends on**: spot-ux-v2

## Goal

Four cross-cutting quality items: global refresh-all button in the header, scratchpad input validation guard-rails, a `toFixed` / `Intl.NumberFormat` format audit across all feature files, and a 1024px overflow check. Spot-specific UX is covered by `spot-ux-v2`.

## Acceptance criteria

- [ ] `RefreshAllButton` rendered exactly once in the dashboard header (right of gear icon); invalidates all Binance query keys at once; debounced 1s leading-edge (rapid clicks coalesce); shows "refreshed Xs ago" counter updating every second
- [ ] Per-panel refresh controls remain functional (regression)
- [ ] Scratchpad Classic / StopFirst / SizeFirst: inline errors for — entry price ≤ 0, leverage ≤ 0, stop on wrong side of entry; downstream output section hidden when any error fires
- [ ] `grep -rn 'toFixed' src/features` returns zero results
- [ ] `grep -rn 'Intl.NumberFormat' src/features` returns zero results
- [ ] At 1024px viewport: outer grid does not overflow horizontally; per-panel tables scroll internally (`overflow-x-auto` on table wrappers)
- [ ] No new features, no schema changes, no new npm dependencies
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] Spec renamed `todo.polish-v1.md` → `done.polish-v1.md`

## Files touched

**New:**
- `src/components/RefreshAllButton.tsx` — debounced button + live "Xs ago" counter

**Edited:**
- `src/App.tsx` — mount `<RefreshAllButton />` in header; add `overflow-x-hidden` guard + 1024px comment
- `src/features/scratchpad/modes/Classic.tsx` — input validation inline errors
- `src/features/scratchpad/modes/StopFirst.tsx` — same
- `src/features/scratchpad/modes/SizeFirst.tsx` — same
- `src/features/**/*.tsx` — `toFixed` / `Intl.NumberFormat` replacements (audit sweep)
- `src/features/perp/PerpPanel.tsx` — `overflow-x-auto` on positions table wrapper
- `src/features/spot/SpotPanel.tsx` — `overflow-x-auto` on lot list wrapper (if needed after spot-ux-v2)

**Renamed:** `docs/backlog/todo.polish-v1.md` → `docs/backlog/done.polish-v1.md`

## Out of scope

- Spot panel UX (tabs, logos, validation, collapsible groups, form order) → `spot-ux-v2`
- Trade-notes empty states → handled in trade-notes spec
- Full responsive design (<1024px unsupported)
- WebSocket, auth, RLS, CSV export

## Implementation notes

- **RefreshAllButton**: `queryClient.invalidateQueries({ predicate: q => q.queryKey[0] === 'binance' })` invalidates all spot + mark price queries in one call. Per-panel buttons keep working because they target narrower keys.
- **Debounce**: leading-edge fire + `useRef` lockout timer (1s), no library. Pattern: `if (lockRef.current) return; fire(); lockRef.current = setTimeout(() => lockRef.current = null, 1000)`.
- **"Xs ago" counter**: `const [elapsed, setElapsed] = useState(0)`; `useEffect` with `setInterval(1000)` increments from last fire time; clears on unmount.
- **Scratchpad errors**: add a `getErrors(inputs): string[]` function to each mode file; render errors below the input grid; hide the MetricRow output section when `errors.length > 0`. Reuse existing input border styling (`border-loss`) or a simple red outline class.
- **Format audit**: search `toFixed` and `Intl.NumberFormat` in `src/features/`; replace with the nearest `fmtUSD` / `fmtNum` / `fmtPrice` / `fmtSigned` / `fmtPct` equivalent. Likely only a few stray calls.
- **1024px**: add `/* 1024px: grid stays 12-col; panels scroll internally */` comment in App.tsx; add `overflow-x-auto` to the perp table wrapper and spot lot list if they clip at narrow widths.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -rn 'toFixed' src/features          # expect: no results
grep -rn 'Intl.NumberFormat' src/features # expect: no results
```

Browser smoke (`yarn dev`):
- Click "refresh all" once → all panels' prices re-fetch; counter resets to "0s ago"
- Mash "refresh all" 5× quickly → only one fetch fires per 1s window
- Per-panel refresh buttons still work independently
- Scratchpad: leverage = 0 → inline error, output section hidden; fix it → output reappears
- Resize window to 1024px → outer grid does not overflow; perp table scrolls inside its panel

Final step: rename `docs/backlog/todo.polish-v1.md` → `docs/backlog/done.polish-v1.md`.
