# bootstrap — scaffold the project shell

**Epic**: scaffold · **Phase**: 0 · **Severity**: 🔴 · **Depends on**: —

## Goal

Stand up a runnable React 18 + TypeScript + Vite project on `main` with Tailwind v4, shadcn/ui-ready config, TanStack Query, a stubbed Supabase client, and the four verification scripts wired and green — so every future spec has something to verify against. Layout-agnostic by design: the dashboard layout and shadcn components are added in a follow-up task once the design system arrives.

## Acceptance criteria

- [ ] `yarn install` succeeds with Yarn classic (v1)
- [ ] `yarn dev` serves http://localhost:5173 rendering "tu.tradeas" heading + "design system pending" note; Tailwind v4 classes apply
- [ ] `yarn typecheck` exits 0
- [ ] `yarn lint` exits 0 (warnings allowed first pass; errors not)
- [ ] `yarn test` runs `src/App.test.tsx` and passes
- [ ] `yarn build` produces `dist/` with no errors; `yarn preview` serves the built site correctly
- [ ] Path alias `@/*` → `src/*` works in both `vite.config.ts` and `tsconfig.app.json`
- [ ] `lib/supabase.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env (no live connection)
- [ ] `.env.example` committed; `.env.local` is gitignored
- [ ] `components.json` present with `style: "new-york"`, `baseColor: "neutral"` — **but no components generated yet**
- [ ] No file > 250 lines
- [ ] No dashboard layout, panel components, or feature folders created
- [ ] Spec file renamed `todo.bootstrap.md` → `done.bootstrap.md` after all checks pass

## Files touched

**New:**
- `package.json` · `index.html` · `vite.config.ts`
- `tsconfig.json` · `tsconfig.app.json` · `tsconfig.node.json`
- `src/main.tsx` · `src/App.tsx` · `src/App.test.tsx` · `src/index.css`
- `src/lib/supabase.ts` · `src/lib/query-client.ts` · `src/lib/utils.ts`
- `src/test/setup.ts`
- `components.json` · `eslint.config.js` · `.prettierrc` · `.env.example`

**Renamed:** `docs/backlog/todo.bootstrap.md` → `docs/backlog/done.bootstrap.md`

## Out of scope

- Feature logic (calculator math, Binance API calls, Supabase queries)
- Database schema / Supabase migrations / live connection
- Auth (single user, deferred)
- Generating shadcn/ui components (added with design system task)
- Dashboard layout, panels, feature folders
- CI (GitHub Actions), Husky / lint-staged / commit hooks
- Routing (single page until product needs more)

## Implementation notes

- **Tailwind v4**: use `@tailwindcss/vite` plugin in `vite.config.ts`; `src/index.css` starts with `@import "tailwindcss";` and a minimal `@theme {}` stub. No `tailwind.config.ts` needed.
- **Path alias** must be configured in **both** `vite.config.ts` (`resolve.alias`) and `tsconfig.app.json` (`compilerOptions.paths`) — easy to forget one.
- **Vitest** config lives inline inside `vite.config.ts` under `test:` key (`environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`).
- **shadcn `cn()` util** in `src/lib/utils.ts` uses `clsx` + `tailwind-merge`.
- **Supabase stub**: `lib/supabase.ts` calls `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`. Missing env vars will fail at runtime — that's fine until creds are wired.
- **Bootstrap commit on `main` is the single allowed exception** to CLAUDE.md's "never commit to main" rule, because `main` doesn't have anything to branch off yet. From the next spec onward, branch-per-spec is mandatory.

## Verification

```bash
yarn install
yarn typecheck && yarn lint && yarn test && yarn build
```

All four green. Then:

```bash
yarn dev   # confirm http://localhost:5173 renders heading + pending note
yarn preview   # confirm built site renders the same
```

Grep checks (must return nothing):

```bash
grep -r "tailwind.config" src/ vite.config.ts 2>/dev/null   # v4 needs no JS config
grep -rE "from ['\"]\\.\\./\\.\\./" src/ 2>/dev/null        # use @/ alias instead of deep relative imports
ls src/components 2>/dev/null                               # no components yet
ls src/features 2>/dev/null                                 # no feature folders yet
```

Manual browser smoke (golden path only — no other features exist):
- Open `yarn dev` URL → heading "tu.tradeas" visible, "design system pending" note visible, page has Tailwind padding/sizing applied (proves CSS pipeline works)

Final step: `git mv docs/backlog/todo.bootstrap.md docs/backlog/done.bootstrap.md`, single commit on `main`, push.
