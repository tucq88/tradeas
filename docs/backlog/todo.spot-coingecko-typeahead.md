# spot-coingecko-typeahead — CoinGecko spot prices + asset typeahead picker

**Epic**: spot · **Phase**: — · **Severity**: 🟠 · **Depends on**: spot-price-graceful-unsupported

## Goal

Replace Binance with CoinGecko as the spot price source (perps stay on Binance), add `coingecko_id` to `spot_lots` with auto-backfill on boot, and replace the asset text input with a typeahead picker that shows held assets first then mcap-ranked global matches with icon + name + rank.

## Acceptance criteria

- [ ] **Migration**: `0003_spot_coingecko.sql` adds `coingecko_id text NULL` + index `spot_lots_coingecko_id_idx`; `SpotLot.coingecko_id: string | null` flows through `SpotLotInput`/`SpotLotPatch`
- [ ] **Coin list cache**: `useCoinList()` returns merged `Map<id, {id, symbol, name, image?, mcap_rank?}>`; persisted in localStorage `coingecko-coin-list` (TTL 24h) + `coingecko-top-coins` (TTL 24h); second mount within window does NOT refetch (DevTools Network tab)
- [ ] **Image cache**: per-id image URLs from `/coins/markets` price calls cached in localStorage `coingecko-image-cache` (no TTL — effectively immutable); covers long-tail coins that lack images in `/coins/list`
- [ ] **Tolerant prices**: `getCoinPrices(ids): Promise<Record<string, {price, image} | null>>`; per-id failure → `null` (carry Spec A pattern); `useCoingeckoPrices` mirrors `useSpotPrices` shape with key `['coingecko', 'prices', sortedIds.join(',')]`
- [ ] **Backfill on boot**: `useCoingeckoBackfill` scans lots where `coingecko_id IS NULL`; exact-ticker match wins (mcap-rank tiebreak); each success persisted via `spotLots.update`; ambiguous (multi-match without rank tiebreak) lots returned as `unresolved`
- [ ] **Unmapped banner**: `<UnmappedAssetBanner />` mounts above LotForm in SpotPanel; renders one row per unresolved lot with inline `AssetPicker`; row clears when user selects
- [ ] **AssetPicker**: input + absolute dropdown (`max-h-[320px] overflow-y-auto`); two sections — "Your assets" (heldIds intersect filter) then "All coins" (mcap-ranked then alpha for unranked); ↑/↓/Enter/Esc keyboard nav; Enter inside form does NOT submit; click-outside closes; each row shows icon · `SYMBOL` · name · `#rank` (omit rank when missing)
- [ ] **TokenLogo override**: optional `src?: string` prop overrides the CoinCap URL; letter-circle fallback unchanged; perp tracker keeps default symbol-based behavior
- [ ] **LotForm + LotRow**: asset input replaced with `<AssetPicker>`; submit writes both `asset` (uppercased symbol) and `coingecko_id`; old `getSpotPrice` blur validation removed (picker only emits valid CG ids by construction)
- [ ] **SpotPanel + AllocationPanel**: use `useCoingeckoPrices(uniqueIds)`; `aggregate.ts` priceMap keyed by `coingecko_id`; legend uses CoinGecko image
- [ ] **Refresh wiring**: `useLastRefreshed`, `useRefreshAllPrices`, `RefreshAllButton` predicates match `['binance']` OR `['coingecko']` — perp + spot both update last-refreshed
- [ ] **Cleanup**: `src/data/binance/spot.ts`, `src/data/hooks/useSpotPrice.ts`, `src/lib/symbols.ts` deleted (verify zero callers via grep first); their test blocks removed
- [ ] No file > 250 lines; no `style={{` in `src/ui/**` or new files; no new npm dependency
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] Migration `0003_spot_coingecko.sql` applied via Supabase dashboard before merging the PR
- [ ] Spec renamed `todo.spot-coingecko-typeahead.md` → `done.spot-coingecko-typeahead.md`

## Files touched

**New:**
- `supabase/migrations/0003_spot_coingecko.sql` — `ALTER TABLE spot_lots ADD COLUMN IF NOT EXISTS coingecko_id text NULL` + index
- `src/data/coingecko/client.ts` — generic `fetchJson<T>` mirroring `binance/client.ts`; throws `CoingeckoError` (kinds: `network` | `http` | `rate-limit`); 429 → `rate-limit`
- `src/data/coingecko/errors.ts` — `CoingeckoError` class
- `src/data/coingecko/coinList.ts` — `getCoinList()` (`/coins/list?include_platform=false`), `getTopCoins(pages)` (`/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1..2`), `mergeCoinList(list, top)`
- `src/data/coingecko/spot.ts` — `getCoinPrices(ids)` via `/coins/markets?vs_currency=usd&ids=...&per_page=250`; chunk if >250; partial-map on per-id failure
- `src/data/coingecko/backfill.ts` — `resolveAssetSymbolToId(symbol, coinList)` exact-ticker + rank tiebreak; `resolveAmbiguous` returns multi-candidate list
- `src/data/hooks/useCoinList.ts` — staleTime 24h; queryFn reads/writes localStorage with TTL
- `src/data/hooks/useCoingeckoPrices.ts` — mirrors `useSpotPrices` shape
- `src/features/spot/useCoingeckoBackfill.ts` — boot effect; auto-resolve + `spotLots.update`; returns `{ unresolved }`
- `src/features/spot/UnmappedAssetBanner.tsx` — banner with per-row inline `AssetPicker`
- `src/ui/AssetPicker.tsx` — input + dropdown component (≤ 200 lines target)
- `src/ui/__tests__/AssetPicker.test.tsx` — selection, keyboard nav, click-outside, sections render heldIds first
- `src/data/__tests__/coingecko.test.ts` — fetch happy paths, error branches, `mergeCoinList` rank tiebreak
- `src/data/__tests__/coingecko-backfill.test.ts` — exact match wins; ambiguous → unresolved; rank tiebreak

**Edited:**
- `src/data/types.ts` — `SpotLot.coingecko_id: string | null`; Input/Patch follow
- `src/data/hooks/useLastRefreshed.ts` — predicate matches `['binance']` OR `['coingecko']`
- `src/data/hooks/useRefreshAllPrices.ts` — invalidate both prefixes
- `src/components/RefreshAllButton.tsx` — predicate widen
- `src/features/spot/SpotPanel.tsx` — swap `useSpotPrices` → `useCoingeckoPrices`; mount `<UnmappedAssetBanner />` above LotForm
- `src/features/spot/aggregate.ts` — `priceMap` keyed by `coingecko_id`; lot lookup on `lot.coingecko_id` (skip if null)
- `src/features/allocation/AllocationPanel.tsx` — same swap; pass coin image to legend `TokenLogo`
- `src/features/spot/LotForm.tsx` — replace asset `<Input>` + blur validation with `<AssetPicker>`
- `src/features/spot/LotRow.tsx` — same in edit mode; remove `getSpotPrice` + `BinanceError` imports
- `src/features/spot/AssetAggregation.tsx` — pass coin image into `TokenLogo`
- `src/ui/TokenLogo.tsx` — add optional `src?: string` prop
- `src/ui/__tests__/TokenLogo.test.tsx` — add explicit `src` override case

**Deleted (after step 8 swap, verify zero callers via grep):**
- `src/data/binance/spot.ts`
- `src/data/hooks/useSpotPrice.ts`
- `src/lib/symbols.ts` (perp does not call `toBinancePair`)
- Their test blocks in `src/data/__tests__/binance.test.ts` and `src/features/spot/__tests__/symbols.test.ts`

## Out of scope

- Perp price source (stays on Binance — separate exchange semantics)
- WebSocket / live price streaming
- Multi-source fallback chains; CoinGecko is sole spot source
- Automated migration runner (manual Supabase dashboard apply per project convention)
- Rebalancing / allocation targets
- Copy-paste import from exchanges

## Implementation notes

- **Build order matters**: schema → CG client → coin list cache → CG prices → TokenLogo prop → AssetPicker → backfill module + banner → big-bang swap (SpotPanel + AllocationPanel + LotForm + LotRow + aggregate keys, single commit) → refresh wiring widen → delete dead Binance spot files. Each step compiles in isolation up to the swap.
- **localStorage cache shape**: `{ ts: number, data: T }`; TTL check: `Date.now() - ts < 24*60*60*1000`. If `JSON.parse` or quota throws, fall back to in-memory only (refetch each session).
- **Image strategy**: `/coins/list` has no images, only `/coins/markets` does. Top-500 covers 99% of held assets; long-tail coins show letter-circle initially, then `/coins/markets` price call returns `image` which is cached in `coingecko-image-cache` (separate localStorage key, no TTL).
- **AssetPicker styling** (no `style={{`): dropdown `absolute top-full left-0 right-0 mt-1 max-h-[320px] overflow-y-auto bg-bg-1 border border-border-1 rounded-sm z-10`; section header `text-fg-3 text-[10px] uppercase tracking-wider px-2 py-1`; row `flex items-center gap-2 px-2 py-1.5 hover:bg-bg-2 cursor-pointer`; keyboard cursor row gets `bg-bg-2`.
- **AssetPicker keyboard**: Enter must `e.preventDefault()` while dropdown is open (avoid form submit). Esc closes. Click-outside via ref + `pointerdown` listener.
- **heldIds prop**: derived in SpotPanel as `[...new Set(wip.map(l => l.coingecko_id).filter(Boolean))]`; passed in. Component does not query lots itself.
- **Symbol case**: CoinGecko `symbol` is lowercase. Display uppercased in dropdown (matches app convention). Storage in `spot_lots.asset` continues to be uppercase.
- **Backfill rule**: exact ticker match → if 1 candidate, auto-resolve. If >1, prefer the one with the lowest `mcap_rank`; if rank is missing for any candidate, treat as ambiguous and surface in banner. Never silently pick when ranks are absent.
- **CoinGecko free-tier limit (30 req/min)**: boot does 3 calls (list + markets p1 + markets p2); each refresh = 1 call. Existing 1s refresh debounce keeps us safe. On 429, treat as transient (retry 1) and surface "rate-limited" hint near the refresh button — do NOT mark prices as null on 429.
- **`useLastRefreshed` predicate**: change from `findAll({ queryKey: ['binance'] })` to a predicate that matches `query.queryKey[0] === 'binance' || query.queryKey[0] === 'coingecko'`. Same shape applies to `useRefreshAllPrices` invalidation.
- **Backfill races** across two open tabs: `spotLots.update` is idempotent; writes converge.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -Rn "binance/spot\|useSpotPrice\b\|toBinancePair" src/   # expect: empty
grep -Rn "useCoingeckoPrices\|useCoinList" src/features/spot src/features/allocation   # expect: hits
grep -Rn "style={{" src/ui/AssetPicker.tsx src/features/spot/UnmappedAssetBanner.tsx   # expect: empty
find src/data/coingecko src/ui/AssetPicker.tsx src/features/spot/UnmappedAssetBanner.tsx -type f -exec wc -l {} \; | awk '$1 > 250'   # expect: empty
```

Browser smoke (`yarn dev`):
- First load: Network tab shows one `coins/list` + `coins/markets?per_page=250&page=1` + `page=2`. Reload within 24h: zero CoinGecko traffic except the price call
- Click LotForm asset field → dropdown opens; type "pe" → "Your assets" shows held PEPE if any; "All coins" shows pepe (id `pepe`) #N + others. Each row has icon + symbol + name + rank. ↓↓ Enter selects; dropdown closes; form does NOT submit
- Submit a new PEPE lot → row appears; aggregation shows live USD value; allocation legend shows the same icon CG uses (not letter fallback)
- Pre-migration BTC lot (`coingecko_id IS NULL`) → on next boot, `coingecko_id` auto-set to `bitcoin` (verify in Supabase); panel renders normally
- Contrived ambiguous lot (`asset='UNI'`) → banner appears at top of SpotPanel "1 asset needs mapping"; inline AssetPicker; selecting Uniswap clears the banner and persists `coingecko_id`
- Refresh All → `last refreshed` updates after CoinGecko price call
- Esc closes dropdown; click outside picker closes dropdown

Regression: perp panel renders Binance mark prices (untouched); scratchpad still computes; settings drawer loads; allocation donut + legend intact.

Final step: rename `docs/backlog/todo.spot-coingecko-typeahead.md` → `docs/backlog/done.spot-coingecko-typeahead.md`.
