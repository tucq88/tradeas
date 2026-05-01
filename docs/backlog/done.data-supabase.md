# data-supabase — Supabase data layer (schema + DAL + dev seed)

**Epic**: data · **Phase**: 5 · **Severity**: 🟠 · **Depends on**: bootstrap

## Goal

Stand up the Supabase data layer for v1: a single SQL migration creating `spot_lots` + `perp_positions` exactly as specced in `CLAUDE.md`, a typed framework-agnostic DAL (`spotLots`, `perpPositions`) with list/create/update/state-transition helpers, and dev-only seed/reset scripts. Auth is deferred — RLS off, single-user, anon key only.

## Acceptance criteria

- [ ] `supabase/migrations/0001_init.sql` creates both tables with the exact columns, types, and check constraints below; idempotent (`create table if not exists`); enables `pgcrypto` for `gen_random_uuid()`
- [ ] `spot_lots(id uuid pk default gen_random_uuid(), created_at timestamptz default now(), asset text not null, amount numeric not null, entry_price numeric not null, cost_usd numeric not null, date date not null, status text not null check (status in ('wip','done')), exit_price numeric null, exit_date date null)`
- [ ] `perp_positions(id uuid pk default gen_random_uuid(), created_at timestamptz default now(), symbol text not null, direction text not null check (direction in ('long','short')), entry_price numeric not null, leverage numeric not null, size_usdt numeric not null, status text not null check (status in ('open','closed')), closed_at timestamptz null, exit_price numeric null)`
- [ ] `src/data/types.ts` exports hand-written TS types `SpotLot`, `PerpPosition` and input/patch variants; field names + nullability match SQL columns 1:1
- [ ] `src/data/spotLots.ts` exports `spotLots.list()`, `.create(input)`, `.update(id, patch)`, `.markDone(id, exitPrice, exitDate)`; `markDone` writes `status='done'`, `exit_price`, `exit_date` in a single update and rejects calls with missing exit fields
- [ ] `src/data/perpPositions.ts` exports `perpPositions.list()`, `.create(input)`, `.update(id, patch)`, `.close(id, exitPrice, closedAt)`; `close` writes `status='closed'`, `exit_price`, `closed_at` in a single update and rejects calls with missing exit fields
- [ ] DAL files contain no React imports and no JSX
- [ ] `src/data/__tests__/spotLots.test.ts` + `perpPositions.test.ts` mock `@/lib/supabase` (vi.mock) and cover happy path + the `markDone`/`close` validation rejection
- [ ] `scripts/db-seed.ts` inserts 2 spot_lots (1 wip, 1 done) + 1 perp_position (open) using **service role key** from env
- [ ] `scripts/db-reset.ts` truncates both tables using service role key (never anon)
- [ ] `package.json` adds `db:seed` and `db:reset` scripts pointing at the above (run via `tsx`)
- [ ] `.env.example` extended with `SUPABASE_SERVICE_ROLE_KEY` (server-only, no `VITE_` prefix)
- [ ] No file > 250 lines; all four checks green
- [ ] Spec renamed `todo.data-supabase.md` → `done.data-supabase.md` after verification

## Files touched

**New:**
- `supabase/migrations/0001_init.sql`
- `src/data/types.ts`
- `src/data/spotLots.ts`
- `src/data/perpPositions.ts`
- `src/data/__tests__/spotLots.test.ts`
- `src/data/__tests__/perpPositions.test.ts`
- `scripts/db-seed.ts`
- `scripts/db-reset.ts`

**Edited:** `package.json` (add `db:seed`, `db:reset`, dev-dep `tsx`), `.env.example` (add `SUPABASE_SERVICE_ROLE_KEY`)

**Renamed:** `docs/backlog/todo.data-supabase.md` → `docs/backlog/done.data-supabase.md`

## Out of scope

- Auth flows (magic-link, sessions) — deferred
- RLS policies — single-user v1, RLS stays off
- Real-time subscriptions / WebSocket
- Generated types via `supabase gen types` (hand-typed for v1's small surface)
- React hooks / TanStack Query wrappers (consumers wire those in later stages)
- Trade-notes schema (Stage 9)

## Implementation notes

- DAL imports the existing client from `@/lib/supabase` (created in bootstrap) — do **not** call `createClient` again. `grep -r 'createClient' src` must return exactly one hit (the bootstrap stub).
- `markDone` / `close` validation: throw `Error('exitPrice and exitDate required')` (and equivalent for perp) **before** the supabase call — keeps the unit test trivial and prevents partial writes.
- `update(id, patch)` accepts a `Partial<>` excluding `id`/`created_at`; do not let callers mutate those.
- `list()` returns rows ordered by `created_at desc` — most recent first matches dashboard ergonomics.
- Scripts run under Node, **not** Vite — they read `process.env.SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (no `VITE_` prefix; service role must never be bundled). Use `dotenv/config` import or `tsx --env-file=.env.local`.
- `db:reset` uses `delete from <table>` (truncate requires elevated perms in some Supabase setups); acceptable for dev.
- Migration is applied manually for v1 — Supabase CLI (`supabase db push`) or the dashboard SQL editor. Document this in verification, not automated.
- Numeric columns: keep as `numeric` (not `double precision`) — exact for money. Convert to JS `number` at DAL boundary; flag in a comment that >2^53 will lose precision (not realistic for this app).

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build   # all green
grep -r 'createClient' src                                # exactly one hit (lib/supabase.ts)
grep -rE "from ['\"]react['\"]" src/data                  # no hits
```

Manual (one-time, documented but not automated):
1. Apply `supabase/migrations/0001_init.sql` via Supabase CLI (`supabase db push`) or dashboard SQL editor
2. `yarn db:seed` → 2 spot_lots + 1 perp_position present in dashboard table view
3. `yarn db:reset` → both tables empty
4. Re-run `yarn db:seed` to leave dev DB in a usable state for downstream stages

Regression: bootstrap's `lib/supabase.ts` still the only `createClient` site; `src/App.test.tsx` still passes (DAL not yet wired into UI).

Final step: rename spec to `done.data-supabase.md` in the same PR.
