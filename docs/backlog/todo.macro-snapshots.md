# macro-snapshots — auto-capture market context at trade events

**Epic**: journal · **Phase**: 9b · **Severity**: 🟠 · **Depends on**: trade-thesis-foundation

## Goal

Automatically capture a snapshot of macro signals (BTC.D, ETH.D, Fear & Greed, BTC vol, BTC funding/OI, plus per-symbol funding/OI for perps) whenever a lot or position is created or closed, plus a manual "snap now" button on the thesis. Display entry vs exit side-by-side in `ThesisDetail`. Frictionless capture is the wedge — the user currently tracks macro mentally.

## Acceptance criteria

- [ ] Migration `supabase/migrations/0004_macro_snapshots.sql` creates `macro_snapshots` table with the schema below; all macro value columns are nullable so partial fetches still write a row
- [ ] Macro source clients (each free, no API key, no new npm dep): `src/data/macro/coingecko.ts` (`getDominance()`), `src/data/macro/fng.ts` (`getFearGreed()`), `src/data/macro/deribit.ts` (`getBtcDvol()`); `src/data/binance/futures.ts` extended with `getFundingRate(symbol)` and `getOpenInterest(symbol)`
- [ ] Each client: tested with mocked fetch — success path returns the value; HTTP 5xx and parse-error paths throw a typed error (extend `BinanceError` pattern or sibling `MacroError`)
- [ ] `src/data/macro/snapshot.ts` exports `captureSnapshot({refType, refId, eventType, symbol?})`: fires all 5 source fetches via `Promise.allSettled`; inserts a row with whatever succeeded (failed sources null); never throws — errors are logged via `console.error`
- [ ] `spotLots.create()` and `spotLots.markDone()` schedule `captureSnapshot` for `('spot_lot', id, 'entry'|'exit')` after the DB write succeeds; `perpPositions.create()` and `perpPositions.close()` do the same with `('perp_position', id, 'entry'|'exit', symbol)`
- [ ] Snapshot is fire-and-forget: trade write resolves immediately; snapshot insert happens asynchronously and never blocks the optimistic UI update
- [ ] `<ThesisDetail />` displays a macro panel: "entry" snapshot (earliest 'entry' row across linked lots/positions), "exit" snapshot (latest 'exit'), and a list of any 'manual' snapshots; columns: BTC.D, ETH.D, F&G, BTC vol, BTC funding, BTC OI, custom text. Missing values render as "—".
- [ ] "Snap now" button in `ThesisDetail` opens an inline form (optional `custom_text` textarea) and calls `captureSnapshot('trade_thesis', thesis.id, 'manual')`; the new row appears in the manual-snapshots list immediately
- [ ] Lot/Position note popover (`<NotesPanel />` from 1a) gets a small inline strip showing the entry snapshot for that ref (BTC.D, F&G, vol — compact) when one exists
- [ ] No file > 250 lines; no new npm dependencies; no `style={{` in `src/ui/**` or new files
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] Spec renamed `todo.macro-snapshots.md` → `done.macro-snapshots.md`

## Files touched

**New:**
- `supabase/migrations/0004_macro_snapshots.sql`
- `src/data/macro/coingecko.ts` — `getDominance(): Promise<{btc:number, eth:number}>`
- `src/data/macro/fng.ts` — `getFearGreed(): Promise<number>`
- `src/data/macro/deribit.ts` — `getBtcDvol(): Promise<number>`
- `src/data/macro/snapshot.ts` — orchestrator + DAL insert
- `src/data/macro/types.ts` — `MacroSnapshot` row type + insert input
- `src/data/__tests__/macro-coingecko.test.ts`
- `src/data/__tests__/macro-fng.test.ts`
- `src/data/__tests__/macro-deribit.test.ts`
- `src/data/__tests__/macro-snapshot.test.ts` — partial-failure produces row with mixed nulls
- `src/features/journal/SnapshotRow.tsx` — display one snapshot
- `src/features/journal/SnapshotPanel.tsx` — entry / exit / manual layout in ThesisDetail

**Edited:**
- `src/data/binance/futures.ts` — add `getFundingRate(symbol)` + `getOpenInterest(symbol)` + tests
- `src/data/binance/__tests__/binance.test.ts` (or `futures.test.ts`) — extend with new tests
- `src/data/spotLots.ts` — call `captureSnapshot` after `create()` and `markDone()`
- `src/data/perpPositions.ts` — call `captureSnapshot` after `create()` and `close()`
- `src/features/journal/ThesisDetail.tsx` — mount `<SnapshotPanel />` + "snap now" button
- `src/features/notes/NotesPanel.tsx` — small entry-snapshot strip when refType is `spot_lot`/`perp_position`

## Out of scope

- Backfill of macro for pre-existing lots/positions (separate spec or manual one-off)
- Regime queries / filtering trades by macro at entry → `edge-analytics`
- Win rate, R-multiples, equity curve, Sharpe → `edge-analytics`
- Traditional macro (DXY, SPX, gold) → future
- Historical chart / sparkline of macro evolution between entry and exit
- WebSocket / live macro updates — snapshots are one-shot

## Implementation notes

- **Schema** (`0004_macro_snapshots.sql`):
  ```sql
  create table macro_snapshots (
    id uuid primary key default gen_random_uuid(),
    captured_at timestamptz not null default now(),
    ref_type text not null check (ref_type in ('trade_thesis','spot_lot','perp_position')),
    ref_id uuid not null,
    event_type text not null check (event_type in ('entry','exit','manual')),
    btc_dominance numeric null,
    eth_dominance numeric null,
    fear_greed int null,
    btc_dvol numeric null,
    btc_funding numeric null,
    btc_oi numeric null,
    symbol_funding numeric null,
    symbol_oi numeric null,
    custom_text text not null default ''
  );
  create index macro_snapshots_ref_idx on macro_snapshots (ref_type, ref_id);
  ```
- **Endpoints** (all free, no key, no CORS issues — verified ahead of time during exploration):
  - CoinGecko: `https://api.coingecko.com/api/v3/global` → `data.market_cap_percentage.{btc,eth}`
  - Fear & Greed: `https://api.alternative.me/fng/?limit=1` → `data[0].value` (string, parse to int)
  - Deribit DVOL: `https://www.deribit.com/api/v2/public/get_volatility_index_data?currency=BTC&start_timestamp={now-2h}&end_timestamp={now}&resolution=3600` → `result.data[last][4]` (close)
  - Binance funding: `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT` → `lastFundingRate`
  - Binance OI: `https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT` → `openInterest`
- **`Promise.allSettled` shape** in `snapshot.ts`:
  ```ts
  const results = await Promise.allSettled([
    getDominance(), getFearGreed(), getBtcDvol(),
    getFundingRate('BTCUSDT'), getOpenInterest('BTCUSDT'),
    symbol ? getFundingRate(symbol) : Promise.resolve(null),
    symbol ? getOpenInterest(symbol) : Promise.resolve(null),
  ]);
  // map each fulfilled to its column; rejected → null + console.error with source name
  ```
- **Fire-and-forget** in DAL:
  ```ts
  // in spotLots.create
  const lot = await insertReturning(...);
  void captureSnapshot({refType:'spot_lot', refId:lot.id, eventType:'entry'}); // unawaited, never throws
  return lot;
  ```
- **Display layout** in `SnapshotPanel`: two-column grid for entry vs exit, with delta arrows (`↑`/`↓`/`–`) on numeric values where both exist; manual snapshots listed below in chronological order with their `custom_text`. Use existing `fmtNum`/`fmtPct` helpers — funding rate and dominance are percentages.
- **NotesPanel inline strip** (when refType ∈ {spot_lot, perp_position}): query `macro_snapshots` filtered to (refType, refId, event_type='entry'), render a single compact row "BTC.D 52.3% · F&G 18 · DVOL 64". Skip if no row exists.
- **CORS check (do this first)**: before writing the clients, manually `curl` each endpoint from a browser tab to confirm they return without preflight issues. CoinGecko sometimes rate-limits; for v1, accept the failure mode (snapshot row gets nulls).
- **Existing `BinanceError` pattern**: extend it or copy. The 3 new sources can share a `MacroError` class with kinds `network`/`http`/`parse`.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

All four green. Then:

```bash
grep -rn "Promise.allSettled" src/data/macro/snapshot.ts   # confirm it's there
wc -l src/features/journal/SnapshotPanel.tsx src/features/journal/SnapshotRow.tsx src/data/macro/*.ts  # each ≤ 250
```

Unit tests in macro client `*.test.ts` files must each cover:
- Happy path: returns parsed number(s)
- HTTP 500: throws typed error
- Malformed JSON: throws typed error
- Network failure: throws typed error

`macro-snapshot.test.ts` must cover:
- All 5 sources resolve → row has all values populated
- 2 of 5 sources reject → row has those columns null, others populated; `console.error` called for each rejection
- All 5 reject → row still inserted with nulls; trade write was unaffected
- Symbol-specific sources skipped when no symbol passed

Manual browser smoke (`yarn dev`):
- Create a spot lot → within ~2s, open journal drawer → linked thesis → entry snapshot row populated
- Mark lot done → exit snapshot row appears alongside; numeric deltas arrow correctly
- Create a perp position with symbol BTCUSDT → entry snapshot includes both BTC reference funding/OI AND symbol funding/OI (same values for BTCUSDT, but column populated)
- Click "snap now" on a thesis → enter "Fed week, CPI tomorrow" → manual row appears with that text
- Throttle network to offline in devtools → create a lot → trade still saves; snapshot row has all nulls; console shows logged errors; UI gracefully shows "—"

Regression checks:
- Phase 1a still works: thesis CRUD, link/unlink, scribbles, drawer
- Spot/perp create/close still finalize without delay even when macro APIs are slow
- No console errors on dashboard load with no theses

Final step: `mv docs/backlog/todo.macro-snapshots.md docs/backlog/done.macro-snapshots.md`.
