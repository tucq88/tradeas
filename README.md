# Tradeas

> **Tradeas** — *Personal Trade Assistant.* One screen, four panels, no spreadsheets.

A single "overlord screen" that replaces a manual Google Sheets workflow for tracking spot DCA lots, perp positions, and pre-trade risk math. Built solo, for one user.

---

## The dashboard

```
┌─────────────────────┬──────────────────────────┐
│                     │  perp positions          │
│  scratchpad         │  mark price · PnL · liq  │
│  pre-trade calc     ├──────────────────────────┤
│                     │  spot portfolio          │
│  • classic          │  DCA lots · realized PnL │
│  • stop-first       ├──────────────────────────┤
│  • size-first       │  allocation              │
│                     │  donut · current value   │
└─────────────────────┴──────────────────────────┘
```

1. **Scratchpad** — pre-trade calculator. Three modes (classic, stop-first, size-first). Nothing persists.
2. **Perp tracker** — manual entry; isolated-margin liquidation math; mark price from Binance Futures.
3. **Spot portfolio** — DCA lots (WIP / done); weighted avg cost; realized + unrealized PnL.
4. **Allocation pie** — derived from current spot holdings at live USD value.

---

## Stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript + Vite |
| Style | Tailwind v4 + shadcn-style primitives |
| Server state | TanStack Query |
| DB / auth | Supabase (Postgres) |
| Prices | Binance public REST — no API key |
| Tests | Vitest + Testing Library |

No streaming. Prices pull on refresh — one click for refresh-all.

---

## Quick start

```bash
yarn install
cp .env.example .env.local        # fill in Supabase URL + anon key
# in Supabase SQL Editor, run in order:
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_perp_mmr.sql
yarn dev
```

---

## Scripts

| Command | What |
|---|---|
| `yarn dev` | start Vite dev server |
| `yarn build` | typecheck + production build |
| `yarn typecheck` | `tsc -b --noEmit` |
| `yarn lint` | ESLint |
| `yarn test` | Vitest (run mode) |
| `yarn db:seed` | seed dev data |
| `yarn db:reset` | wipe + reseed |

PR gate: `yarn typecheck && yarn lint && yarn test && yarn build` — all four green.

---

## Repo layout

```
src/
  features/      scratchpad · spot · perp · allocation · settings
  data/          DAL (spotLots, perpPositions) + binance/ + hooks/
  ui/            primitives (Button, Input, Card, …)
  lib/           supabase client, formatters, liq math, symbols
  state/         local UI state (settings, etc.)
supabase/
  migrations/    hand-written SQL, applied via dashboard
docs/
  backlog/       todo.<slug>.md → done.<slug>.md  (see Workflow)
```

---

## Workflow

**No work without a spec.** Every change starts as `docs/backlog/todo.<slug>.md` and ends with that file renamed to `done.<slug>.md` once verified and merged. The rename is the source of truth for what's shipped.

Per-item loop — **plan → do → check → act**:

1. Write `docs/backlog/todo.<slug>.md` from the spec template
2. Implement against the spec — if scope drifts, update the spec first
3. Run the PR gate (above)
4. Walk the spec's `## Verification` section (browser smoke for UI)
5. `mv todo.<slug>.md done.<slug>.md`

Spec format and full conventions live in [`CLAUDE.md`](./CLAUDE.md).

---

## Status

Solo project, active. See [`docs/backlog/`](./docs/backlog/) for shipped (`done.*`) and queued (`todo.*`) work.
