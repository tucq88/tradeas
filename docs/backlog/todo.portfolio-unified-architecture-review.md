# portfolio-unified-architecture-review — revisit cross-feature portfolio composition

**Epic**: portfolio · **Phase**: — · **Severity**: 🟡 · **Depends on**: ledger-qa-release-checklist

## Goal

Scoping review (not an implementation): once the ledger MVP has shipped, revisit whether to lift spot / perp / ledger position engines into a shared `src/domain/portfolio/` boundary and upgrade `AllocationPanel` (and possibly add a new "unified portfolio summary") to span all three areas. Outcome of this review is either a set of new implementation specs, or an explicit "leave as-is" decision recorded in this file before it's renamed `done.*`.

## Why this is deferred (read first)

The domain/business case for unified portfolio management is clear today: the user is one capital allocator across spot lots, perp positions, and ledger vaults/agents. The current `AllocationPanel` is spot-only — it doesn't know about perp notional or ledger current value, so "where is my capital?" needs three screens.

The reason this is *not* being done now: code architecture follows "make it work first". Spot and perp engines (`src/features/spot/aggregate.ts`, `src/features/perp/{aggregate,compute}.ts`) live colocated with their features and use JS floats. That's correct *today* — nothing else consumes them, and forcing Decimal precision into live-price math is cargo-cult. The ledger pattern is the *target*; the existing engines are the *legacy*. Refactoring them before the ledger ships would be a premature abstraction (CLAUDE.md: "three similar lines is better than a premature abstraction").

## Acceptance criteria (for the review, not the implementation)

- [ ] Read the current state of `src/features/spot/aggregate.ts`, `src/features/perp/aggregate.ts`, `src/features/perp/compute.ts`, and `src/domain/accounting/{vault,agent}.ts` (the latter two will exist post-ledger)
- [ ] Decide whether to introduce `src/domain/portfolio/` as a new cross-feature boundary; document the call (yes / no / partial) in this spec under a new `## Decision` section
- [ ] If yes: enumerate which engines move (lift, not rewrite — keep float math as-is) and which stay colocated
- [ ] Decide whether `AllocationPanel` should be upgraded to span perp + ledger, kept spot-only with a separate "Unified Portfolio" view added, or left untouched
- [ ] Decide whether a new `src/domain/portfolio/unifiedSummary.ts` (compose spot + perp + ledger into single totals: current exposure, lifetime realized PnL, allocation breakdown) is worth a spec
- [ ] If new specs fall out, write them as `todo.portfolio-*.md` with the project format; reference this review in their `Depends on` field
- [ ] If "leave as-is", record the reasoning here and rename to `done.*`

## Out of scope for this review

- Rewriting spot/perp engines to use Decimal (they're fine on floats; hand-typed cost basis to 2dp doesn't accrue precision drift)
- Retrofitting the ledger's "events over time + snapshots" model onto spot/perp (different problem; spot/perp are current-snapshot-from-current-price)
- Replacing the four-panel "overlord" dashboard layout
- Pre-committing to a unified ledger of trading + ledger PnL (separate question, separate review)

## Implementation notes (for the future specs, if any)

If unification gets the green light, the natural sequencing is:

1. Lift engines verbatim — no signature changes — from `src/features/{spot,perp}/` to `src/domain/portfolio/{spot,perp}.ts`. Keep float math. Keep tests.
2. Add `src/domain/portfolio/unifiedSummary.ts` that imports all three engines (spot, perp, ledger position state) and reduces to: total current exposure, lifetime realized PnL, allocation breakdown by asset/product. Single Decimal-typed output for the totals; per-area subtotals can stay in their native precision.
3. Upgrade `AllocationPanel` (or add a new `UnifiedPortfolioPanel`) consuming `unifiedSummary`. Allocation pie includes perp margin / notional + ledger current value, not just spot.
4. The `Trading` mode dashboard might gain a top KPI strip (or a fifth panel) showing the unified summary; the `Ledger` mode `Portfolio` view might link out to it. Decide during the review.

Be wary of: forcing Decimal everywhere (don't), inventing a unified `Position` interface that erases the genuine differences between spot lots / perp positions / vault shares (don't), preempting `src/domain/account/` or `src/domain/fees/` if they haven't surfaced as real needs (don't).

## Verification (for the review)

```bash
ls docs/backlog/done.ledger-*.md   # all 13 ledger specs must be done before this review starts
```

Read these files in order, then write the `## Decision` section in this spec:
- `docs/backlog/notes.ledger-context.md`
- `src/features/spot/aggregate.ts`, `src/features/perp/aggregate.ts`, `src/features/perp/compute.ts`
- `src/domain/accounting/{vault,agent,weeklyReview}.ts`
- `src/features/allocation/AllocationPanel.tsx`

If new specs are produced, run `yarn typecheck && yarn lint && yarn test && yarn build` is *not* required for this review — it's a paper exercise. Verification of the new specs is each spec's own concern.

Final step: rename `docs/backlog/todo.portfolio-unified-architecture-review.md` → `docs/backlog/done.portfolio-unified-architecture-review.md` once the `## Decision` section is written, regardless of which way it goes.
