# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Tradeas** (Personal Trade Assistant) is a personal crypto trading management dashboard — a single "overlord screen" replacing a manual Google Sheets workflow. Built for one user (solo).

## Commands

> To be added once the project is bootstrapped.

## Architecture

### Stack
- **React 18 + TypeScript + Vite** — frontend
- **Tailwind CSS + shadcn/ui** — styling and components
- **TanStack Query** — server state, Binance price fetching (on-demand, no streaming)
- **Supabase** — PostgreSQL database + auth (single user)
- **Binance public REST API** — price source of truth (no API key required for spot/futures prices)

### Four panels on a single dashboard

**1. Pre-trade Scratchpad** — calculator only, nothing persisted
- Mode 1 (Classic): entry + stop → position size, liq price, liq distance %, targets at 1R/2R/3R
- Mode 2 (Stop-first): market entry + stop → max safe size for risk% + R/R targets
- Mode 3 (Size-first): fixed USDT size + entry + stop → actual $ risk + R/R breakdown
- Account balance and risk % (default 2%) are global scratchpad settings
- All perp positions use **isolated margin** — use Binance isolated margin liquidation formula
- Designed to support more modes later; keep the mode system extensible

**2. Perp position tracker** — persisted, manual entry
- Fields: symbol, direction (long/short), entry price, leverage, size (USDT)
- On refresh: fetch Binance futures mark price → compute unrealized PnL, liq price, liq distance %
- Isolated margin liquidation formula (Binance): 
  - Long: `liq = entry × (1 - 1/leverage + MMR)`
  - Short: `liq = entry × (1 + 1/leverage - MMR)`
  - MMR (maintenance margin rate) varies by tier — start with 0.5% as default

**3. Spot portfolio tracker** — persisted, manual entry
- DCA lots: date, asset, amount, entry price, cost USD
- Status: WIP (holding) or Done (sold) — Done requires exit price + exit date → realized PnL
- Per-asset aggregation: weighted avg cost, total invested, current value, unrealized PnL
- Binance spot price fetched on refresh per unique asset symbol

**4. Portfolio allocation pie** — derived from spot holdings, current market values

### Data model (Supabase)

```
spot_lots
  id, created_at, asset, amount, entry_price, cost_usd, date
  status: 'wip' | 'done'
  exit_price?, exit_date?   -- populated when status = done

perp_positions
  id, created_at, symbol, direction: 'long' | 'short'
  entry_price, leverage, size_usdt
  status: 'open' | 'closed'
  closed_at?, exit_price?   -- populated when closed
```

### Key constraints
- Prices: Binance public API, fetched on page refresh (not streaming — WebSocket deferred)
- All values in USD only (VND tracking dropped)
- Rebalancing and allocation targets are deferred
- Copy-paste import from exchanges is deferred — manual entry only

## Backlog workflow (STRICT — must follow)

**No work without a spec.** Every change starts as `docs/backlog/todo.<slug>.md`. Once the work is verified and merged, rename the file to `docs/backlog/done.<slug>.md`. The `todo.*` → `done.*` rename is the source of truth for what's been completed.

Per-item loop (plan → do → check → act):

1. **Plan**: create `docs/backlog/todo.<slug>.md` from the spec template below
2. **Do**: implement against the spec — do not deviate; if scope changes, update the spec first
3. **Check**: `yarn typecheck && yarn lint && yarn test && yarn build` — all green
4. **Verify**: walk the spec's `## Verification` section (browser smoke for UI)
5. **Act**: rename `docs/backlog/todo.<slug>.md` → `docs/backlog/done.<slug>.md`

If you finish work and the spec wasn't created, you skipped step 1 — go back and write it before merging.

## Git workflow (deferred)

> Will be activated once the repo is initialized as a git repo and pushed to a remote. Until then, work directly on the working tree but still follow the backlog spec loop above.

Once active:
- Branch off `main` per backlog item. Never commit to `main`; never merge PRs (human reviewer does); never touch `staging`.
- Branch prefixes: `feat/` · `fix/` · `ref/` · `chore/`
- The spec rename (`todo.*` → `done.*`) happens in the same PR as the implementation.

## Backlog spec format

Each `docs/backlog/todo.<slug>.md` is an implementation-ready spec. Motto: **know how to validate = know how to implement**.

Header line (first line after title):
`**Epic**: <name or "standalone"> · **Phase**: <N or —> · **Severity**: 🔴|🟠|🟡 · **Depends on**: <slugs or —>`

Required sections:

- `## Goal` — 1–2 sentences: what + why
- `## Acceptance criteria` — testable checklist; each item maps to a verification step. Include negative criteria ("no file > 250 lines", "no `style={{` in src/ui/**")
- `## Files touched` — *optional for greenfield, required for refactor/split tasks*. Exact paths + what happens to each (new / edited / deleted / renamed)
- `## Out of scope` — explicit exclusions so reviewers + agents don't scope-creep
- `## Implementation notes` — invariants to preserve, gotchas from reading the code, non-obvious order of operations
- `## Verification` — checklist format:
  - `yarn typecheck && yarn lint && yarn test && yarn build` green
  - grep commands (exact)
  - manual browser steps (exact routes + actions)
  - regression checks on adjacent features that share state

Keep specs ≤ ~100 lines. If it's longer, the task is probably too big — split it.

## Verification (FE reality)

No pure TDD for UI. Every PR must pass:

- `yarn typecheck && yarn lint && yarn test && yarn build`
- Browser smoke for UI changes: golden path + one edge case + one adjacent feature that shares state
- Regression checks listed in the item's `## Verification` section
