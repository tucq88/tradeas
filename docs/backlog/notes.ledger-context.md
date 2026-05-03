# ledger context — vault & agent performance tracker

Read this before implementing any `todo.ledger-*.md` spec.

## Why this feature exists

Tradeas's existing panels (perp tracker, spot lots, allocation) cover personal trading positions opened on exchanges directly. The ledger feature covers a different lifecycle: **funds deposited into managed strategies** — vaults (passive, share-based) and agents (active, equity-snapshot-based) — where the user is a *capital allocator*, not the executing trader.

Existing tracking (Google Sheets) breaks once partial withdrawals enter the picture: simple "deposit vs current balance" ROI no longer answers "how much can I take out without touching principal?"

## Product mantra

The sheet is the notebook, not the brain. Raw events are the notebook; deterministic accounting functions are the brain; UI renders calculated facts. AI may explain facts later — it must not invent accounting results.

## Vault vs agent

**Vault** — passive strategy access via shares.
- Deposits add shares; withdrawals burn shares.
- User value = `sharesHeld × currentSharePrice`.
- Share price snapshots are entered manually until APIs exist.

**Agent** — active automated strategy on a user-connected venue (Lighter today; Binance / Hyperliquid / MT5 later).
- Not share-based. Tracked via deposits + withdrawals + equity snapshots.
- User value = latest equity snapshot.

## Why partial withdrawals are hard

Example: deposit 4,000 USDC → strategy grows → withdraw 500 USDC. Current value still > 4,000. The user needs to see: current exposure, cash withdrawn, lifetime PnL, realized profit, whether the withdrawal touched principal, and lifetime cash-recovered percent.

## Accounting policy — profit-first withdrawal waterfall

At withdrawal time:
- `availableProfit = max(0, positionValueBeforeWithdrawal - depositsBeforeWithdrawal)`
- `realizedProfit = min(withdrawalAmount, availableProfit)`
- `principalTouchedByWithdrawal = max(0, withdrawalAmount - realizedProfit)`

Do not confuse:
- `principalTouchedByWithdrawal` — event-level amount that exceeded available profit
- `cashRecoveredPercent` — `totalWithdrawn / totalDeposited` across lifetime

## Key formulas

- Vault current value: `sharesHeld × currentSharePrice`
- Agent current value: `latestEquitySnapshot`
- Lifetime PnL: `currentValue + totalWithdrawn - totalDeposited`
- Weekly PnL: `endValue + withdrawalsThisWeek - depositsThisWeek - startValue`
- Suggested TP: `max(0, min(weeklyPnL, currentValue - totalDeposited))`
- House money: `totalWithdrawn >= totalDeposited`

## User workflow (manual-first MVP)

1. Add accounts (e.g. Quant Terminal vault account, Lighter agent account)
2. Add vault or agent products (Golden vault, XAU agent, etc.)
3. Enter deposits and withdrawals
4. Enter vault share price snapshots and agent equity snapshots
5. Review portfolio and positions
6. On Sunday, review weekly PnL and suggested TP
7. Track profit bank and house-money status

## Tradeas integration constraints

- New feature lives under a `Ledger` mode (top-level toggle alongside the existing `Trading` mode in the header — no router added)
- Sub-views inside Ledger: Portfolio · Positions · Weekly · Profit Bank · Transactions · Snapshots · Imports
- Domain code lives under `src/domain/accounting/` (no React imports). `src/domain/` is the cross-feature boundary; it's expected to grow (e.g. `src/domain/fees/` once funding-fee / commission accounting needs to bridge perp + ledger). Do **not** pre-create empty subfolders
- Decimal math (`decimal.js`) is mandatory for all ledger money/share calculations. Existing perp/spot float math is unchanged
- Single user — no `user_id` columns (matches `spot_lots` / `perp_positions`)
- Supabase JS returns numeric columns as strings; the ledger should consume them as strings directly into `Decimal` (no float round-trip)
- Tables prefixed `ledger_` to avoid collision with existing `spot_lots` / `perp_positions`

## Risk and messaging guardrails

Never imply: guaranteed yield, risk-free profit, safe weekly income, trading cannot lose money, suggested TP is financial advice.

Preferred language: suggested TP, available profit based on accounting rules, historical performance, current exposure, below principal floor, house-money status.

## Out of scope for MVP

- Trading execution, automated withdrawals, exchange API key management
- Tax accounting, portfolio optimization
- LLM-generated accounting decisions (AI coach is a separate post-MVP epic)
- Venue API sync (Quant Terminal, Lighter, etc.)
- ORAI staking / token mechanics

## Implementation priorities

1. Correct accounting over pretty UI
2. Deterministic tests over manual inspection
3. Manual input before API automation
4. Clear warnings over hidden assumptions
5. Small task specs over giant feature branches
