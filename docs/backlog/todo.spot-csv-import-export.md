# spot-csv-import-export

**Epic**: standalone · **Phase**: — · **Severity**: 🟠 · **Depends on**: —

## Goal
Add CSV export and import to the spot portfolio panel so the user can bulk-load existing lots from Google Sheets and back up / restore data without one-by-one manual entry.

## Acceptance criteria
- [ ] `import` and `export` buttons sit in a small toolbar above `LotForm` inside the WIP tab (not the card header — `cardAction` is already crowded with refresh state)
- [ ] `export` downloads `spot-lots-YYYY-MM-DD.csv` with all lots (wip + done); disabled when 0 lots
- [ ] `import` opens a file picker (`.csv` only)
- [ ] After file selection a preview modal shows: total rows, valid count, error count, and up to **20** row-level errors with "+N more" if truncated
- [ ] Confirm button label reflects state: `import N valid lots` (or `import N valid lots (skip M errors)`); disabled when valid count = 0 or import is pending
- [ ] Valid rows are bulk-inserted via a single `.insert(array).select()`; invalid rows are reported in the preview and not sent to Supabase
- [ ] If the bulk insert itself fails (DB-level rejection), surface a single error in the modal — do **not** silently fall back to per-row inserts or claim partial success
- [ ] After successful import, `['spot-lots']` query is invalidated and new lots appear immediately
- [ ] `done` lots import correctly with `exit_price` and `exit_date` and show in the Realized tab with correct PnL
- [ ] Round-trip on an empty DB: `export` → `import` produces lots whose canonical fields (`asset`, `date`, `amount`, `entry_price`, `cost_usd`, `status`, `exit_price`, `exit_date`) match the originals exactly — only `id` and `created_at` differ
- [ ] Re-importing the same file onto a non-empty DB **will** create duplicates — dedup is explicitly out of scope and the modal does not warn about it
- [ ] No CSV / spreadsheet library added; `grep -rE "papaparse|csv-parse|xlsx" src/` returns nothing
- [ ] Size caps: `src/lib/csv.ts` ≤ 120 lines, `src/features/spot/ImportPreviewModal.tsx` ≤ 150 lines

## Files touched
- `docs/backlog/todo.spot-csv-import-export.md` — new (this file), renamed to `done.*` on completion
- `src/lib/csv.ts` — new (parse, serialize, download)
- `src/lib/__tests__/csv.test.ts` — new (parse + validate cases listed below)
- `src/features/spot/ImportPreviewModal.tsx` — new (preview / confirm dialog)
- `src/data/spotLots.ts` — edited (add `bulkCreate(inputs: SpotLotInput[]): Promise<SpotLot[]>` using `.insert(array).select()`, no `.single()`)
- `src/data/__tests__/spotLots.test.ts` — edited (cover `bulkCreate` happy path + supabase-error path)
- `src/features/spot/SpotPanel.tsx` — edited (toolbar above `LotForm` with import/export buttons, modal wiring)

## Out of scope
- Drag-and-drop file upload
- Column-mapping UI
- Perp positions import/export
- Update / upsert / dedupe semantics — import only **inserts**
- Binance symbol validation on import (LotForm validates on blur; CSV path skips it to avoid 50-row API fanout — accept asset as-is after trim+uppercase)

## Implementation notes

CSV canonical header: `asset,date,amount,entry_price,cost_usd,status,exit_price,exit_date`

| Column | Required | Validation |
|---|---|---|
| `asset` | Yes | non-empty after trim; auto-uppercased |
| `date` | Yes | `YYYY-MM-DD` or `MM/DD/YYYY`, normalized to `YYYY-MM-DD` |
| `amount` | Yes | finite, > 0 |
| `entry_price` | Yes | finite, > 0 |
| `cost_usd` | Yes | finite, > 0 (preserve original cost basis — do **not** recompute as `amount × entry_price`) |
| `status` | Yes | `wip` or `done`, case-insensitive |
| `exit_price` | when `done` | finite, > 0; **must be empty when `wip`** |
| `exit_date` | when `done` | `YYYY-MM-DD`; **must be empty when `wip`** |

Parser robustness (real Sheets/Excel exports):
- Strip a leading UTF-8 BOM (`﻿`)
- Accept LF or CRLF line endings
- Skip blank / whitespace-only lines silently (not counted as errors)
- Extra columns beyond the canonical header are **ignored** (header-driven mapping by name, not position) — lets users keep notes/tags columns
- Missing required column in header → fail entire parse with one error, no per-row processing
- Minimal quoted-field splitter (~15 lines) handles commas inside quoted values and escaped `""`

Serializer:
- Empty string for `null` `exit_price` / `exit_date` (clean round-trip — not the literal `"null"`)
- Always emit canonical header order
- Numbers serialized without locale grouping (use `String(n)`, not `toLocaleString`)

UI plumbing:
- Reset `fileInputRef.current.value = ''` after import success / cancel / error so the same file can be re-selected
- Modal is dismissable (Escape / backdrop click / cancel button) without side effects
- On successful import: invalidate `['spot-lots']`, close modal, reset file input

## Verification
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green
- [ ] `grep -rE "papaparse|csv-parse|xlsx" src/` returns nothing
- [ ] `wc -l src/lib/csv.ts src/features/spot/ImportPreviewModal.tsx` — both under their caps
- [ ] Export with ≥ 1 lot → file downloads; open in Sheets, header + columns match spec; null exit fields are blank cells
- [ ] Export disabled when 0 lots (cleared DB)
- [ ] Round-trip on empty DB: import the just-exported file → row count and field values match originals
- [ ] BOM tolerance: prepend `﻿` to a valid CSV → still parses
- [ ] CRLF tolerance: re-save CSV with CRLF endings → still parses
- [ ] Extra column: add a `notes` column to a valid CSV → ignored, all rows valid
- [ ] Missing column: drop `amount` from header → preview shows single header error, 0 rows processed
- [ ] Per-row errors: row 3 has `amount=` (empty), row 5 has `status=wip,exit_price=42` → preview shows both as errors, other rows import; "+N more" appears past 20 errors
- [ ] Done lot: `status=done,exit_price=50000,exit_date=2024-03-01` → appears in Realized tab with correct PnL
- [ ] Bulk insert failure path: mock `bulkCreate` to reject → modal shows single error, no rows inserted, file input still resettable
- [ ] Regression: `LotForm` add still works; `refresh` button + `refreshed HH:MM` still work; Realized tab still renders
