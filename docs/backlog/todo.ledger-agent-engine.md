# ledger-agent-engine — deterministic agent accounting

**Epic**: ledger · **Phase**: 1 · **Severity**: 🔴 · **Depends on**: ledger-data-model

## Goal

Implement deterministic agent accounting for equity-based products where current value comes from account-equity snapshots, not shares.

## Acceptance criteria

- [ ] `computeAgentPosition(transactions, equitySnapshots, asOf, options?)` returns `{ totalDeposited, totalWithdrawn, latestEquity, latestEquityAt, currentValue, lifetimePnl, warnings }` — numeric fields as `Decimal`
- [ ] Agent positions ignore `sharesDelta` and `sharePrice` on transactions
- [ ] `currentValue = latestEquitySnapshot.equity` (latest snapshot at or before `asOf`)
- [ ] `lifetimePnl = currentValue + totalWithdrawn - totalDeposited`
- [ ] Missing equity snapshot → `currentValue = null`, `lifetimePnl = null`, warning `missing_snapshot`
- [ ] Stale equity snapshot (older than `staleAfterDays` from `asOf`, default 3) → warning `stale_snapshot`; `currentValue` still returned
- [ ] Agent withdrawal classification uses the latest known equity *before* the withdrawal event (reuses `classifyWithdrawal` from vault spec)
- [ ] No agent calculation requires vault share price
- [ ] Test fixtures from spec context (deposit 1000; equity snapshots 1020 / 1051; current value 1051; lifetime PnL 51; missing snapshot returns warning) all pass
- [ ] `yarn test agent` green

## Files touched

**New:**
- `src/domain/accounting/agent.ts` — `computeAgentPosition`
- `src/domain/accounting/__tests__/agent.test.ts`

**Edited:**
- `src/domain/accounting/types.ts` — add `AgentPositionState`
- `src/domain/accounting/snapshots.ts` — `isStale(snapshotAt, asOf, staleAfterDays)` helper if not already present

## Out of scope

- Venue API sync (Lighter / Binance / Hyperliquid)
- Open positions, order history, trade history
- Agent strategy performance attribution
- Fee-token mechanics
- Weekly review (next spec)

## Implementation notes

- Do **not** infer current equity from deposits/withdrawals alone — that's the bug the manual ledger exists to solve.
- Snapshot lookup must be shared with weekly review (same `latestAtOrBefore` from `snapshots.ts`) — avoid drift.
- `staleAfterDays` defaults to 3 for current dashboard views; weekly review will override to 7 (per its own spec).
- Use deterministic warnings so UI and (future) AI coach consume the same facts.
- Agent position key is `(accountId, productId)`; the accounting function operates on already-filtered transactions and snapshots for one position. Filtering is the caller's responsibility.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
yarn test agent
grep -Rn "sharePrice\|sharesDelta" src/domain/accounting/agent.ts   # expect: only in comments / guard tests
grep -Rn "Number(\|parseFloat\|Math\.round" src/domain/accounting   # expect: empty
```

Regression: vault tests (`yarn test vault`) still pass after the shared `snapshots.ts` helper changes.

Final step: rename `docs/backlog/todo.ledger-agent-engine.md` → `docs/backlog/done.ledger-agent-engine.md`.
