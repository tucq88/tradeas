# spot-price-graceful-unsupported — partial-result spot price fetch

**Epic**: spot · **Phase**: — · **Severity**: 🟠 · **Depends on**: spot-tracker, allocation-pie

## Goal

Make the batch spot-price fetch tolerant of unknown / delisted symbols so the panel and allocation pie render partial data, and stop the TanStack Query console error generated when a saved lot's symbol no longer resolves on Binance.

## Acceptance criteria

- [ ] **Tolerant batch**: `getSpotPrices(symbols)` returns `Record<string, number | null>` and never throws; on any failure of the batched URL, falls back to per-symbol `getSpotPrice` via `Promise.allSettled`, with rejected entries → `null`
- [ ] **Single-symbol contract preserved**: `getSpotPrice(symbol)` keeps throwing `BinanceError` (LotForm/LotRow blur validation depends on `kind === 'unknown-symbol'`)
- [ ] **Hook type widened**: `useSpotPrices` typed `UseQueryResult<Record<string, number | null>>`; `retry` logic unchanged
- [ ] **Aggregator null-safe**: `aggregateWip` treats `priceMap[pair] === null` identically to a missing key; wraps `toBinancePair(asset)` in try/catch so a non-alphanumeric asset doesn't throw inside the aggregator
- [ ] **Asset row hint**: `AssetAggregation` shows existing `—` for value/PnL when `currentValue === null`, plus a `text-fg-3 text-[10px]` "price unavailable" hint below the value cell
- [ ] **Allocation legend hint**: `AllocationPanel` adds a `text-fg-3 text-[11px]` "unavailable" footer line listing assets without a price; pie itself unchanged (`computeSlices` already filters)
- [ ] **Console clean**: dashboard load with at least one delisted asset in lots produces zero `Error: BinanceError unknown-symbol` lines
- [ ] **No regressions**: LotForm typing `BTCASD` + blur still shows inline "unknown symbol" error; happy-path BTC/ETH rows unchanged
- [ ] No file > 250 lines; no `style={{` in any edited file; no new npm dependency
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] Spec renamed `todo.spot-price-graceful-unsupported.md` → `done.spot-price-graceful-unsupported.md` after all checks pass

## Files touched

**Edited:**
- `src/data/binance/spot.ts` — `getSpotPrices` returns `Record<string, number | null>`; on batch throw, fall back to `Promise.allSettled(symbols.map(getSpotPrice))`; rejected → `null`. `getSpotPrice` unchanged.
- `src/data/hooks/useSpotPrice.ts` — return type widens via the queryFn change; no `retry` change
- `src/features/spot/aggregate.ts` — `priceMap: Record<string, number | null>`; null-equivalent-to-missing; try/catch around `toBinancePair`
- `src/features/spot/AssetAggregation.tsx` — add "price unavailable" hint when `currentValue === null`
- `src/features/allocation/AllocationPanel.tsx` — add "unavailable" footer line in legend
- `src/data/__tests__/binance.test.ts` — add: batched fetch with one bad symbol returns partial map; chunk-fallback partial network failure; happy path unchanged
- `src/features/spot/__tests__/aggregate.test.ts` — add: priceMap with explicit `null` value yields null currentValue/PnL/pctDelta

**No new files. No deletions.**

## Out of scope

- Replacing Binance with CoinGecko as the spot source (next spec — `spot-coingecko-typeahead`)
- Asset typeahead picker
- Schema changes
- Perp price path (untouched — perp tracker has its own hook)
- Any global `QueryCache.onError` handler (rejected — global suppression masks legit failures)

## Implementation notes

- **Transformation, not suppression**: the queryFn is what TanStack Query logs on rejection. Make it always resolve (returning a partial map with `null` for failed symbols) and the console noise disappears without any global handler.
- **Fallback mechanics**: try the batched `?symbols=[...]` URL first (1 request, the happy path). On any throw — including `BinanceError(kind='unknown-symbol')` from `client.ts:18-24` triggered by code -1121 — `Promise.allSettled(symbols.map(s => getSpotPrice(s)))`. Map fulfilled → number, rejected → null. Worst case is N+1 requests; with N≤10 typical portfolios this is fine.
- **NaN handling**: `getSpotPrice` throws on `Number.isNaN(price)`. The wrapper catches the throw → entry becomes `null`, not propagated.
- **Aggregator**: `aggregate.ts:26-30` already returns null for currentValue/unrealizedPnl/pctDelta when `spotPrice === undefined`; explicit `null` from the new map flows through the same code path with no logic change. The only required edit is the parameter type and the `toBinancePair` try/catch.
- **AssetAggregation hint**: place under the value cell, only when in the WIP set (already implied by the panel mounting it). Reuse existing PnL color logic; the hint is muted (`text-fg-3`).
- **AllocationPanel footer**: derive `unavailable = aggregations.filter(a => a.currentValue === null).map(a => a.asset)`; render only when non-empty; format `<asset> · price unavailable` per asset, comma-separated or one-per-line — match the existing legend density.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -RnE "Record<string, number>" src/data/binance/spot.ts src/data/hooks/useSpotPrice.ts src/features/spot/aggregate.ts   # expect: empty (must read number | null)
```

Browser smoke (`yarn dev`):
- Insert a WIP lot with `asset='LUNA'` (delisted on Binance); SpotPanel renders BTC/ETH normally; LUNA row shows `—` + "price unavailable" hint; **zero console errors**
- Allocation pie: BTC + ETH only; legend has "unavailable" footer line including LUNA
- LotForm: type `BTCASD` and blur → inline "unknown symbol" error still appears, Add Lot button stays disabled (single-symbol path preserved)
- Remove the LUNA lot → panel returns to normal state, footer line disappears

Regression: BTC + ETH WIP entries continue to show value, PnL, and pct correctly; perp panel + scratchpad untouched; refresh button + last-refreshed still works.

Final step: rename `docs/backlog/todo.spot-price-graceful-unsupported.md` → `docs/backlog/done.spot-price-graceful-unsupported.md`.
