# design-foundation — wire tokens, primitives, and the empty 4-panel shell

**Epic**: foundation · **Phase**: 1 · **Severity**: 🟠 · **Depends on**: bootstrap

## Goal

Translate the locked design system (`docs/design/`) into the running app: import the CSS token layer, expose tokens as Tailwind theme keys, extract reusable primitives to `src/ui/`, render the empty 4-panel dashboard shell, and ship the number-formatting utils every later panel will depend on. No business logic, no data layer.

## Acceptance criteria

- [ ] `src/styles/tokens.css` is a verbatim copy of `docs/design/colors_and_type.css` (Geist + JetBrains Mono `@import` included) and is imported once from `src/main.tsx` before `src/index.css`
- [ ] Tailwind v4 `@theme` block in `src/index.css` exposes: `bg-bg-{0,1,2,3,inset}`, `text-fg-{1,2,3,4}`, `text-profit`, `text-loss`, `text-warn`, `text-neutral`, `text-accent`, `border-border-{1,2,emph}`, `font-sans` → Geist stack, `font-mono` → JetBrains Mono stack — each backed by the `--var` from tokens.css (no raw hex)
- [ ] `body` has `font-variant-numeric: tabular-nums` applied globally (via tokens.css element defaults — verified by computed style on a `<p>`)
- [ ] Primitives translated JSX → TSX, one per file, each with explicit prop types: `src/ui/Card.tsx`, `src/ui/Button.tsx`, `src/ui/Input.tsx`, `src/ui/Tabs.tsx`, `src/ui/Badge.tsx`, `src/ui/MetricRow.tsx`, `src/ui/StatusDot.tsx`
- [ ] `src/lib/format.ts` exports `fmtUSD`, `fmtNum`, `fmtPct`, `fmtSigned` matching `primitives.jsx` semantics (uses `−` U+2212, never hyphen, for negatives); unit-tested in `src/lib/format.test.ts` covering positive, negative, zero, large, fractional
- [ ] `src/App.tsx` renders: header (lowercase wordmark `tu.tradeas` with accent dot, status dot) + 2×2 grid of empty `<Card>` panels titled `scratchpad`, `perp`, `spot`, `allocation` — each panel contains a single `fg-3` "no data" placeholder line
- [ ] Layout: 12-col CSS grid, `gap: 16px`, page padding `24px`, panels span as 2×2 at `≥1280px` viewport (use Tailwind utility classes wired to tokens, not inline styles)
- [ ] Negative: no file in `src/` exceeds 250 lines
- [ ] Negative: zero occurrences of `style={{` under `src/ui/**` (Tailwind classes only)
- [ ] Negative: zero raw hex literals (`#[0-9a-fA-F]{3,8}`) under `src/` outside `src/styles/tokens.css`
- [ ] Negative: zero ASCII-hyphen `-` used as minus sign in `src/lib/format.ts` (only `−`)
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] Spec renamed `todo.design-foundation.md` → `done.design-foundation.md` after verification

## Files touched

**New:**
- `src/styles/tokens.css` (copied from `docs/design/colors_and_type.css`)
- `src/ui/Card.tsx` · `src/ui/Button.tsx` · `src/ui/Input.tsx` · `src/ui/Tabs.tsx` · `src/ui/Badge.tsx` · `src/ui/MetricRow.tsx` · `src/ui/StatusDot.tsx`
- `src/lib/format.ts` · `src/lib/format.test.ts`

**Edited:**
- `src/main.tsx` — import `./styles/tokens.css` before `./index.css`
- `src/index.css` — add `@theme {}` mapping CSS vars → Tailwind keys
- `src/App.tsx` — replace placeholder with header + 4-panel grid

## Out of scope

- Calculator math / mode logic (Stage 2)
- Settings store, localStorage (Stage 3)
- Binance fetching, TanStack Query wiring (Stage 4)
- Supabase DAL (Stage 5)
- Per-panel real content (rows, inputs, pie) — placeholders only
- shadcn component generation — primitives are hand-rolled here; defer shadcn to features that need it
- Responsive breakpoints below 1280px (desktop-only per `CLAUDE.md`)

## Implementation notes

- Tailwind v4 takes its theme from `@theme {}` inside CSS, not `tailwind.config.ts`. Token names use `--color-bg-0` etc. so Tailwind generates `bg-bg-0`, `text-fg-2`, `border-border-1` — keep names short to match the design doc.
- `tokens.css` already sets `html, body { background: var(--bg-0); color: var(--fg-1); ... }` and `font-variant-numeric: tabular-nums` on `code, .num`. Apply `.mono` / `font-mono` to numeric containers; the body inherits sans by default.
- Translate `Panel` → `Card`: header row (44px, lowercase 13px label, optional `count` slot), body with 14/18 padding, 1px `border-border-1`, `bg-bg-1`, `rounded-md`. Don't reproduce `tt-*` class names — use Tailwind utilities only.
- `MetricRow` ≠ `MetricCard` — the new primitive is the dense label/value row used inside panels (mirrors `tt-metric` block); single-purpose, no delta logic yet.
- `format.ts` must use `−` (U+2212) for negatives — copy the exact functions from `primitives.jsx` lines 2-12. Add JSDoc one-liners.
- Lucide is allowed for the status dot fallback if needed, but a styled `<span>` in `StatusDot.tsx` is simpler — match `tt-dot-ok` (7px circle, `--profit` fill, soft halo via box-shadow).
- Header layout: brand-left, optional nav-center (empty for now), status-right. Don't add nav links yet — Stage 9 introduces the journal route.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

Grep checks (must return nothing unless noted):

```bash
grep -rE "style=\{\{" src/ui/                                  # zero
grep -rEn "#[0-9a-fA-F]{3,8}" src/ --include="*.ts" --include="*.tsx" --include="*.css" | grep -v "src/styles/tokens.css"  # zero
grep -nE "['\"]-[0-9]" src/lib/format.ts                       # zero ascii minus in format util
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + | awk '$1 > 250'   # zero
ls src/ui/ | sort                                              # Badge Button Card Input MetricRow StatusDot Tabs (.tsx each)
```

Manual browser smoke (`yarn dev`, http://localhost:5173):

- Header reads `tu.tradeas` (lowercase, Geist, accent-colored dot/period); status dot visible top-right with green halo
- Four panels visible in a 2×2 grid: titles `scratchpad`, `perp`, `spot`, `allocation`; each shows muted "no data" placeholder
- Page background is `--bg-0` (near-black, slightly cool); panels are one luminance step lighter (`--bg-1`)
- DevTools → computed style on a `<p>` shows `font-variant-numeric: tabular-nums`; on `code` or `.num` shows `JetBrains Mono`; on header shows `Geist`
- Resize window to 1280px wide — grid stays 2×2, no horizontal scroll, 16px gaps, 24px outer padding intact
- Network tab confirms Geist + JetBrains Mono load from `fonts.googleapis.com`

Regression check (adjacent state — bootstrap):

- `yarn preview` still serves the built site; `@/` alias still resolves; `yarn test` still picks up the existing `src/App.test.tsx` (update it if it asserted the old "design system pending" string)

Final: `git mv docs/backlog/todo.design-foundation.md docs/backlog/done.design-foundation.md`.
