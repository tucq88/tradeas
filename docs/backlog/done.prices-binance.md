# prices-binance — Binance public REST price layer

**Epic**: prices · **Phase**: 4 · **Severity**: 🟠 · **Depends on**: bootstrap

## Goal

Stand up the price-fetching layer using Binance public REST endpoints via TanStack Query. Provide single + batched hooks for spot and futures mark price, surface a per-panel last-refreshed timestamp + manual refresh control, and distinguish network failure vs unknown-symbol error states so the UI can render them separately.

## Acceptance criteria

- [ ] `useSpotPrice(symbol)` returns `{ data: number | undefined, error, isLoading, refetch }` from `GET https://api.binance.com/api/v3/ticker/price?symbol=...`
- [ ] `useSpotPrices(symbols[])` batches via the array form `?symbols=["BTCUSDT","ETHUSDT"]` (single network call), returns a `Record<symbol, number>`
- [ ] `useMarkPrice(symbol)` returns mark price from `GET https://fapi.binance.com/fapi/v1/premiumIndex?symbol=...` (`response.markPrice` parsed to number)
- [ ] `useMarkPrices(symbols[])` batches by calling `premiumIndex` without `symbol` param then filtering the requested set (single network call)
- [ ] All symbols normalize to uppercase before being keyed/queried (`btcusdt` → `BTCUSDT`)
- [ ] `useLastRefreshed()` returns the most recent successful fetch timestamp across price queries (Date | null)
- [ ] `refreshAllPrices()` invalidates every query under the `['binance']` query key prefix
- [ ] Error taxonomy: hooks expose `error.kind: 'network' | 'http' | 'unknown-symbol'` so UI can branch — Binance code `-1121` maps to `unknown-symbol`
- [ ] TanStack Query defaults set: `staleTime: 30_000`, `gcTime: 5 * 60_000`, `refetchOnWindowFocus: true`, `retry: 1`
- [ ] Tests in `src/data/__tests__/binance.test.ts` cover: golden round-trip (spot + mark, single + batched), uppercase normalization, each error branch (network throw, HTTP 500, HTTP 400 `-1121`)
- [ ] No file > 250 lines
- [ ] No API keys read or referenced anywhere
- [ ] No WebSocket / `ws://` / `wss://` usage
- [ ] No `axios` dependency added — native `fetch` only
- [ ] No module-scope mutable state outside the QueryClient (last-refreshed derived from query meta, not a singleton var)
- [ ] Spec renamed `todo.prices-binance.md` → `done.prices-binance.md` after all checks pass

## Files touched

**New:**
- `src/data/binance/client.ts` — `fetchJson` wrapper, error mapping (network/http/unknown-symbol)
- `src/data/binance/spot.ts` — `getSpotPrice`, `getSpotPrices` (array form)
- `src/data/binance/futures.ts` — `getMarkPrice`, `getMarkPrices`
- `src/data/binance/errors.ts` — `BinanceError` class + `kind` discriminator
- `src/data/hooks/useSpotPrice.ts` — `useSpotPrice`, `useSpotPrices`, exports query keys
- `src/data/hooks/useMarkPrice.ts` — `useMarkPrice`, `useMarkPrices`, exports query keys
- `src/data/hooks/useLastRefreshed.ts` — derives newest `dataUpdatedAt` across `['binance']` queries
- `src/data/hooks/useRefreshAllPrices.ts` — exports `refreshAllPrices()` (invalidate `['binance']`)
- `src/data/__tests__/binance.test.ts` — vitest + mocked `global.fetch`

**Edited:**
- `src/main.tsx` — wrap `<App />` in `QueryClientProvider` using the bootstrap-provided client (with the defaults above)

**Renamed:** `docs/backlog/todo.prices-binance.md` → `docs/backlog/done.prices-binance.md`

## Out of scope

- WebSocket streaming (deferred per CLAUDE.md)
- Auto-refresh on interval (manual refresh only for v1)
- Exchange-specific symbol mapping / aliasing (caller passes Binance-shaped symbols)
- Rate-limit backoff / 429 handling beyond the single retry
- Persisting last-refreshed across reloads
- UI styling of the refresh control / timestamp (Stage 6/7 panels own their own placement)
- Supabase, panel wiring, or any consumer beyond the placeholder smoke component

## Implementation notes

- Query keys: `['binance', 'spot', 'price', SYMBOL]`, `['binance', 'spot', 'prices', SYMBOLS_SORTED_JOINED]`, `['binance', 'futures', 'mark', SYMBOL]`, `['binance', 'futures', 'mark', 'all']`. Prefix `['binance']` is the single invalidation handle.
- `client.ts#fetchJson` rules: try/catch around `fetch` → `TypeError` becomes `BinanceError('network')`. Non-2xx → parse body, if JSON has `code === -1121` map to `unknown-symbol`, else `http`. Always rethrow the `BinanceError` so TanStack Query stores it on `error`.
- Batched spot: URL-encode the JSON array exactly as `symbols=%5B%22BTCUSDT%22%2C%22ETHUSDT%22%5D`. Sort symbols before keying so `[A,B]` and `[B,A]` share a cache entry.
- Batched mark: `premiumIndex` with no symbol returns the full universe; filter client-side to the requested set. Single call is cheaper than N parallel calls and shares one cache entry across panels.
- `useLastRefreshed` reads `queryClient.getQueriesData({ queryKey: ['binance'] })` + each query's `state.dataUpdatedAt`; returns `max` as `Date` or `null` when empty. Recompute via `useQueryClient` + `useSyncExternalStore` on the cache, not a manual ref.
- `retry: 1` applies to network/http; do NOT retry `unknown-symbol` (would just burn requests). Implement via `retry: (failureCount, err) => err.kind !== 'unknown-symbol' && failureCount < 1`.
- Symbols normalize at the hook boundary, before keying — not inside the fetcher — so cache hits work regardless of caller casing.
- All number parsing through `Number(x)`; reject `NaN` as `http` error to avoid silently rendering bad data.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

All green. Then:

```bash
grep -rE "axios|ws://|wss://|API_KEY|apiKey" src/ 2>/dev/null   # must return nothing
grep -rE "let [A-Za-z_]+ =" src/data/binance/ 2>/dev/null       # no module-scope mutable state
```

Browser smoke (placeholder consumer in `App.tsx` calling `useSpotPrice('BTCUSDT')` + a refresh button wired to `refreshAllPrices()`):
- Page loads → BTCUSDT price renders within ~1s
- Click refresh → "last refreshed" timestamp updates to now
- DevTools throttle to "Offline" → refresh → UI shows distinct network-error state (not generic)
- Change consumer to `useSpotPrice('ZZZUSDT')` → UI shows distinct unknown-symbol state
- Restore network + valid symbol → next refresh recovers cleanly

Final step: `git mv docs/backlog/todo.prices-binance.md docs/backlog/done.prices-binance.md` in the implementation PR.
