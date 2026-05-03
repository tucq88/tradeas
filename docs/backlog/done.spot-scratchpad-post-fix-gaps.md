# spot-scratchpad-post-fix-gaps — close gaps from session bug-fix sweep

**Epic**: standalone · **Phase**: — · **Severity**: 🟠 · **Depends on**: spot-coingecko-typeahead, scratchpad-ui-tweaks

## Goal

Close 8 remaining gaps surfaced by a fresh review of this session's spot + scratchpad bug fixes: one silent data-corruption bug (AssetPicker desync), four UX/correctness gaps (CSV-imported lots not backfilled mid-session, AllocationPanel mislabeling all-prices-unresolved as empty, partial/invalid dates silently no-op, easy-to-miss stop-beyond-liq warning), and three quality items (resolver semantics, cross-asset id collision, triplicated scratchpad logic).

## Acceptance criteria

- [ ] **#5 AssetPicker controlled** — typing into the picker after selecting clears the parent's `coingecko_id`; submit disabled until a real selection exists; impossible to save a lot under a previously-selected coin
- [ ] **#1 Backfill re-runs for new symbols** — CSV-imported lots with `coingecko_id IS NULL` get resolved within the same session; previously-failed symbols are NOT retried in the same hook lifecycle
- [ ] **#2 AllocationPanel three-state** — empty (no WIP) shows "no WIP lots yet"; WIP lots exist but all prices unresolved shows "X assets · prices unavailable" with the asset names; partial unresolved still shows the existing footer
- [ ] **#3 Date validation** — invalid calendar dates (`2026-02-30`, `2026-13-99`) blocked at form level with a visible inline error; submit disabled; valid `2026-02-28` re-enables
- [ ] **#4 Stop-beyond-liq louder** — warning rendered in `text-loss` color adjacent to liq-price row; stop input border turns red when violated; calc still proceeds (non-blocking)
- [ ] **#6 Resolver kind split** — `ResolveResult` includes a distinct `kind: 'not_found'` for zero matches; `kind: 'ambiguous'` reserved for >1 candidates without rank tiebreak
- [ ] **#7 Aggregate by id-or-asset** — two lots with same asset symbol but different `coingecko_id` produce two distinct AssetAgg buckets
- [ ] **#8 Shared LiqPreview** — `getErrors` + `hasBase`/`baseLiq`/`baseLiqDist`/`stopBeyondLiq` derivation + the validation/liq markup live in exactly one place; Classic/StopFirst/SizeFirst all consume it
- [ ] No file > 250 lines; no `style={{` in `src/ui/**` or new shared files; no new npm dependency
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] Spec renamed `todo.spot-scratchpad-post-fix-gaps.md` → `done.spot-scratchpad-post-fix-gaps.md`

## Files touched

**New:**
- `src/features/scratchpad/lib/useLiqPreview.ts` — pure derivation hook returning `{ errors, hasBase, baseLiq, baseLiqDist, stopBeyondLiq }`
- `src/features/scratchpad/components/LiqPreview.tsx` — renders error list + liq metrics block + warning

**Edited:**
- `src/ui/AssetPicker.tsx` — controlled API (`value`/`onChange`); add optional `wrapperClassName` if needed for #4 (only if shared by other consumers)
- `src/features/spot/LotForm.tsx` — `selectedEntry: CoinListEntry | null` form state; calendar validation + visible error
- `src/features/spot/UnmappedAssetBanner.tsx` — adapt to controlled AssetPicker (`value={null}`, treat onChange as commit)
- `src/features/spot/useCoingeckoBackfill.ts` — `triedAssetsRef: Set<string>`; depend on derived unmapped-asset list
- `src/features/spot/aggregate.ts` — group by `lot.coingecko_id ?? lot.asset.toUpperCase()`
- `src/features/allocation/AllocationPanel.tsx` — three-state empty/all-unresolved/has-slices
- `src/data/coingecko/backfill.ts` — `kind: 'not_found'` added; `matches.length === 0` returns it
- `src/ui/Input.tsx` — add `wrapperClassName?: string` so callers can highlight the outer label border (used by #4)
- `src/features/scratchpad/modes/Classic.tsx` / `StopFirst.tsx` / `SizeFirst.tsx` — use shared hook + component; pass `stopBeyondLiq` into stop input's `wrapperClassName`
- `src/data/__tests__/coingecko-backfill.test.ts` — assert `not_found` kind for empty matches
- `src/features/allocation/__tests__/donut-data.test.ts` — already covers empty-slices; no change required (computeSlices behavior unchanged; AllocationPanel rendering covered by smoke)
- `src/features/spot/__tests__/aggregate.test.ts` *(new if missing, else edit)* — same-symbol-different-id case

## Out of scope

- WebSocket / live price streaming
- Persisting scratchpad state across reloads
- Replacing `pickerKey` remount-on-submit with a `reset` prop
- Resolver mcap_rank thresholds (e.g. require top-500)
- Migrating `AssetAgg` external shape (still `AssetAgg[]`; only the internal grouping key changes)
- Backfill banner copy split for `not_found` vs `ambiguous` (kind is added; copy follows in a separate spec)

## Implementation notes

- **AssetPicker controlled API**: `value: CoinListEntry | null`, `onChange: (entry: CoinListEntry | null) => void`. Internal `query` state stays — initialize from `value?.symbol.toUpperCase() ?? ''`. On keystroke that diverges from `value?.symbol.toUpperCase()`, fire `onChange(null)` so parent state clears immediately. Commit (Enter / row click) sets `query = entry.symbol.toUpperCase()` and fires `onChange(entry)`. The existing `pickerKey` remount-on-submit pattern in LotForm continues to reset `query`.
- **LotForm state shape**: collapse `asset` + `coingecko_id` into a single `selectedEntry: CoinListEntry | null`. Mutation derives `asset = selectedEntry.symbol.toUpperCase()` and `coingecko_id = selectedEntry.id`. Submit disabled when `!selectedEntry || !isValidISODate(date) || amount/cost/entry_price NaN`.
- **UnmappedAssetBanner**: each row is "select once and the row vanishes" — it never holds a selection across renders. Pass `value={null}` and treat the first non-null `onChange` as the commit (call existing `handleSelect`).
- **useCoingeckoBackfill set-based tracking**: `triedAssetsRef = useRef(new Set<string>())`. Inside the effect, derive `unmappedAssets = Array.from(new Set(lots.filter(l => !l.coingecko_id).map(l => l.asset)))`, drop those already in `triedAssetsRef`, resolve the rest, mark all attempted (success or fail) into the ref. Effect dep: a stable join of `unmappedAssets`. Use `useMemo` to compute `unmappedAssets`. ESLint exhaustive-deps already disabled in this file.
- **AllocationPanel states**: keep `slices`, `unavailableAssets` derivations. Add `const hasWip = wip.length > 0;` and `const allUnresolved = hasWip && slices.length === 0;`. Three render branches: `(!hasWip)` "no WIP lots yet"; `(allUnresolved)` "X asset(s) · price(s) unavailable" with a refresh affordance; otherwise the donut + legend (current code). The existing `unavailableAssets` footer keeps working for partial cases.
- **isValidISODate**: regex `/^\d{4}-\d{2}-\d{2}$/` plus `Date` parse with UTC round-trip — `const d = new Date(s + 'T00:00:00Z'); !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s`. Catches `2026-02-30`, `2026-13-99`. Keep it local to `LotForm.tsx` (single caller).
- **Stop-beyond-liq highlighting** uses a new `wrapperClassName` prop on `Input` (the existing `className` only reaches the inner `<input>`, but the visible border lives on the wrapping `<label>`). Modes pass `wrapperClassName={preview.stopBeyondLiq ? 'border-loss' : ''}` to their stop `<Input>`.
- **Aggregate grouping**: change `byAsset.get(lot.asset)` to `bucketKey = lot.coingecko_id ?? lot.asset.toUpperCase()`. The displayed `asset` and `image` come from any lot in the bucket. `coingecko_id` for the bucket comes from any non-null lot (same as today). The output is still `AssetAgg[]` so no consumer changes; the bucket count just becomes more accurate when ids differ.
- **Resolver kind split**: `matches.length === 0` returns `{ kind: 'not_found' }`; multi-match without rank tiebreak still returns `{ kind: 'ambiguous', candidates }`. `useCoingeckoBackfill` currently treats both as "skip" — same behavior, plus future banner gets to differentiate. Tests need a new `not_found` assertion (existing "returns ambiguous when no candidates" test gets retitled).
- **Shared LiqPreview**: `useLiqPreview({ side, entry, stop, leverage })` parses the strings, returns `{ errors: string[], hasBase, baseLiq: number | null, baseLiqDist: number | null, stopBeyondLiq }`. `<LiqPreview {...preview} />` renders the validation `<ul>` and (when `hasBase`) the two `MetricRow`s + warning. Each mode keeps its mode-specific `compute*()` and post-`out` markup.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -Rn "triedRef" src/features/spot/                                          # expect: empty
grep -Rn "onSelect" src/ui/AssetPicker.tsx                                      # expect: empty (renamed onChange)
grep -Rn "kind: 'ambiguous', candidates: \[\]" src/                             # expect: empty
grep -Rn "getErrors" src/features/scratchpad/modes/                             # expect: empty (moved to hook)
grep -Rn "style={{" src/features/scratchpad/components/ src/features/scratchpad/lib/  # expect: empty
find src/features/scratchpad src/features/spot src/features/allocation src/ui/AssetPicker.tsx -type f -exec wc -l {} \; | awk '$1 > 250'  # expect: empty
```

Browser smoke (`yarn dev`):
- **#5 desync**: open LotForm, click picker, select BTC. Form input shows "BTC", submit enabled. Type "ETH" without committing → submit becomes disabled (because onChange(null) cleared selectedEntry). Pick ETH from dropdown → submit re-enables. Submit → row saves as ETH (verify in Supabase).
- **#1 mid-session backfill**: import a CSV containing a coin not in your held set. After import, AssetAggregation row appears immediately with "price unavailable", then on next backfill cycle (re-render after lots refetch) the coingecko_id resolves and price hydrates — no reload required.
- **#2 all-unresolved**: temporarily edit `useCoingeckoPrices` mock or block the network → AllocationPanel says "X asset(s) · prices unavailable" listing assets, NOT "no WIP lots yet".
- **#3 date validation**: type `2026-02-30` → red inline error appears, submit disabled. Correct to `2026-02-28` → error clears, submit enabled.
- **#4 stop-beyond-liq**: in any scratchpad mode, set entry=100 stop=80 leverage=20 (long) so liq is around 95, then move stop to 70 → warning shows in red adjacent to liq row, stop input border turns red. Calc still renders below.
- **#7**: covered by unit test (rare to repro by hand).
- **#8 regression**: all three scratchpad modes render identical liq/dist behavior after refactor; entering bad inputs shows same errors as before.

Regressions:
- Perp panel renders Binance mark prices (untouched)
- Refresh All updates last-refreshed
- Spot CSV import flow still works end-to-end
- AllocationPanel donut still renders for healthy state

Final: rename `docs/backlog/todo.spot-scratchpad-post-fix-gaps.md` → `docs/backlog/done.spot-scratchpad-post-fix-gaps.md`.
