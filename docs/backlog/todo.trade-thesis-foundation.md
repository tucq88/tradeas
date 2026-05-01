# trade-thesis-foundation — thesis entity + journal drawer + lot/position scribbles

**Epic**: journal · **Phase**: 9 · **Severity**: 🟠 · **Depends on**: spot-tracker, perp-tracker

## Goal

Introduce a `trade_thesis` entity that groups related lots and perp positions, surfaced in a right-side journal drawer with editable writeup (markdown-lite) and free-text notes. Lots and positions get a count-badge → popover for inline scribbles. This is the journaling-habit migration from Notion; macro snapshots come in `macro-snapshots`.

## Acceptance criteria

- [ ] Migration `supabase/migrations/0003_trade_thesis.sql` creates `trade_thesis`, `thesis_links`, `trade_notes` tables with the schema below; `ref_id` columns are intentionally not foreign keys (polymorphic, documented in migration comment)
- [ ] DAL files exist and pass tests: `src/data/tradeThesis.ts`, `src/data/thesisLinks.ts`, `src/data/tradeNotes.ts` — each mirrors the `src/data/spotLots.ts` shape (mocked supabase contract tests)
- [ ] `src/features/notes/markdown.ts` pipeline runs in this exact order: HTML-escape entire body → URL autolink (regex excludes trailing `.,;:!?)`; only `https?://`) → `\n`→`<br>` → return as `{ __html }`. Returns sanitized output for `dangerouslySetInnerHTML`.
- [ ] Markdown unit tests cover: plain text passthrough, `\n`→`<br>`, URL autolink with target=_blank rel=noreferrer, trailing-punctuation trim (`see https://x.com/foo.` → link excludes the dot), `**bold**`/`# heading`/`- list`/`` `code` `` rendered literally (NOT interpreted), `<script>alert(1)</script>` rendered as escaped text
- [ ] Header (`src/App.tsx`) gains a 📒 button left of the gear icon; clicking opens `<JournalDrawer />` (slide-in from right, mirrors `SettingsDrawer` shell)
- [ ] `JournalDrawer` shows two collapsible sections — "active" theses + "closed" — each lists `<ThesisCard />` rows; "+ new thesis" opens an inline form (name + opened_at)
- [ ] Clicking a thesis card opens `<ThesisDetail />`: editable name, editable writeup textarea (rendered through markdown-lite below in preview), linked lots/positions list with unlink button per row, "link…" picker (shows unlinked WIP lots + open perp positions), notes feed (newest first), close-thesis action
- [ ] `LotRow.tsx` and `PositionRow.tsx` show a note-count badge (`{n}`) when notes exist for that lot/position; clicking the badge (or an always-visible note icon) opens a popover with `<NotesPanel refType refId />` — list of notes + textarea to add
- [ ] Adding a note from a row updates the badge count without reload (TanStack Query invalidation of `['tradeNotes','byRef',refType,refId]`); same when adding from the journal drawer
- [ ] Note bodies are sanitized via `markdown.ts` before any rendering — `dangerouslySetInnerHTML` appears ONLY paired with markdown.ts output
- [ ] No file > 250 lines; no new npm dependencies; no `style={{` in `src/ui/**` or new files
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] Spec renamed `todo.trade-thesis-foundation.md` → `done.trade-thesis-foundation.md`; old `docs/backlog/todo.trade-notes.md` deleted in the same change

## Files touched

**New:**
- `supabase/migrations/0003_trade_thesis.sql`
- `src/data/tradeThesis.ts` — `list/get/create/update/close/delete`
- `src/data/thesisLinks.ts` — `listByThesis/listByRef/link/unlink`
- `src/data/tradeNotes.ts` — `listByRef/listAll/create/delete`
- `src/data/__tests__/tradeThesis.test.ts`
- `src/data/__tests__/thesisLinks.test.ts`
- `src/data/__tests__/tradeNotes.test.ts`
- `src/data/types.ts` — extend with `TradeThesis`, `ThesisLink`, `TradeNote` and their input/patch types
- `src/features/notes/markdown.ts`
- `src/features/notes/__tests__/markdown.test.ts`
- `src/features/notes/NotesPanel.tsx`
- `src/features/notes/NoteBadge.tsx` — small reusable count badge + popover wrapper
- `src/features/journal/JournalDrawer.tsx`
- `src/features/journal/ThesisCard.tsx`
- `src/features/journal/ThesisDetail.tsx`
- `src/features/journal/ThesisForm.tsx` — inline create form
- `src/features/journal/LinkPicker.tsx` — list unlinked WIP lots + open positions

**Edited:**
- `src/App.tsx` — header gains 📒 button + `JournalDrawer` mount
- `src/features/spot/LotRow.tsx` — note badge in display row
- `src/features/perp/PositionRow.tsx` — note badge in display row

**Deleted:**
- `docs/backlog/todo.trade-notes.md` (superseded)

## Out of scope

- Macro snapshots and any external API integration → `macro-snapshots`
- Edge metrics (win rate, R-multiples, equity curve, Sharpe) → `edge-analytics`
- Regime queries / filtering by macro → `edge-analytics`
- Image/screenshot attachments — explicitly skipped per spec scoping
- Search / full-text query
- Tag autocomplete UI
- Editing existing notes (delete + recreate is fine for v1)
- Note pinning, reordering

## Implementation notes

- **Schema** (in migration with comment "ref_id is intentionally polymorphic — Postgres can't FK against two tables; integrity is app-side for solo v1"):
  ```sql
  create table trade_thesis (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    name text not null,
    status text not null check (status in ('active','closed')),
    opened_at date not null,
    closed_at date null,
    writeup text not null default ''
  );
  create table thesis_links (
    id uuid primary key default gen_random_uuid(),
    thesis_id uuid not null references trade_thesis(id) on delete cascade,
    ref_type text not null check (ref_type in ('spot_lot','perp_position')),
    ref_id uuid not null
  );
  create index thesis_links_ref_idx on thesis_links (ref_type, ref_id);
  create table trade_notes (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    ref_type text not null check (ref_type in ('trade_thesis','spot_lot','perp_position')),
    ref_id uuid not null,
    body text not null
  );
  create index trade_notes_ref_idx on trade_notes (ref_type, ref_id);
  ```
- **TanStack Query keys**: `['tradeThesis','list']`, `['tradeThesis','get',id]`, `['thesisLinks','byThesis',id]`, `['thesisLinks','byRef',refType,refId]`, `['tradeNotes','byRef',refType,refId]`, `['tradeNotes','all']`. `create`/`delete`/`unlink` invalidate the relevant keys.
- **Markdown pipeline order matters** — escape FIRST so the only HTML present is the `<a>`/`<br>` we inject ourselves. Regex for autolink: `/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g` (trailing-punct exclusion).
- **NoteBadge**: render only when `count > 0`; popover positioning — simple `relative` anchor + `absolute` panel, click-outside closes (mirror existing dropdown patterns if any, otherwise simple `useEffect` listener). Keep ≤ 80 lines.
- **Drawer shell**: copy `SettingsDrawer.tsx` outer div verbatim — `fixed inset-y-0 right-0 z-50 w-96 bg-bg-1 border-l border-border-1 flex flex-col`. Wider than settings (w-96 vs w-80) to fit the thesis detail.
- **Drawer state**: lift `selectedThesisId: string | null` into `JournalDrawer`; null = list view, set = detail view; render conditionally. No router needed.
- **LinkPicker**: query both `spotLots.list()` filtered to status=wip AND `perpPositions.list()` filtered to status=open, exclude refs already in `thesis_links` for current thesis. Show as a small list of selectable rows.
- **N+1 avoidance for badges**: fetch `tradeNotes.listAll()` once at the top of `LotRow`/`PositionRow` parent? No — instead, expose `tradeNotes.countsByRef()` returning `Record<refType:refId, count>` and consume from a single shared query. Simpler v1 alternative: `listByRef` per row but with a stable query key — TanStack Query dedupes; acceptable at solo-user scale (≤30 rows). Document the choice in code.
- **Notes feed in ThesisDetail**: shows notes for the thesis itself (`refType='trade_thesis'`, `refId=thesis.id`) — does NOT aggregate notes from linked lots/positions in v1 (those live on the rows). Aggregation can come later.
- **Closing a thesis**: button in `ThesisDetail` calls `tradeThesis.close(id, today)` → status='closed', closed_at=today. Linked lots/positions remain linked.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -rn "dangerouslySetInnerHTML" src/                       # only in NotesPanel + ThesisDetail (writeup preview), paired with markdown.ts
grep -rE "(^|[^a-zA-Z])eval\(|new Function\(" src/features/   # nothing
wc -l src/features/journal/*.tsx src/features/notes/*.tsx src/data/trade*.ts src/data/thesisLinks.ts  # each ≤ 250
```

Browser smoke (`yarn dev`):
- Click 📒 in header → drawer opens, shows "no theses yet" state
- "+ new thesis" → form → submit → drawer shows it under Active
- Click thesis card → detail view; edit name + writeup → save → reopen → persisted
- "link…" picker → select an existing WIP spot lot → row appears under Linked → unlink → row disappears
- Add a note in the thesis notes feed → appears immediately, body sanitized (try `<script>` — escaped)
- Add a note via the LotRow badge popover → badge count increments → reopens with the note visible
- Paste `https://example.com.` in a note → renders as link with `https://example.com` (period stripped from link)
- Close thesis → it moves from Active to Closed section

Regression checks:
- Spot panel still renders; create/edit/markDone/refresh still work
- Perp panel still renders; create/close/refresh still work
- Settings drawer still opens (we did not break the existing drawer)
- Allocation donut still renders

Final step: `mv docs/backlog/todo.trade-thesis-foundation.md docs/backlog/done.trade-thesis-foundation.md` AND `rm docs/backlog/todo.trade-notes.md` in the same change.
