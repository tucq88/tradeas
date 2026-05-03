# ledger-csv-shared-refactor — lift spot CSV import infra into a shared module

**Epic**: ledger · **Phase**: 3 · **Severity**: 🟠 · **Depends on**: —

## Goal

Lift the spot CSV import preview / validation / error-row UX (currently colocated in `src/features/spot/ImportPreviewModal.tsx`) into a generic shared module so the upcoming ledger CSV import can reuse it instead of duplicating. Same UX, same modal, parameterized by row schema + column mapping.

## Acceptance criteria

- [ ] New `src/lib/csv/` module exports: `parseCsv(text, options)`, `validateRows<T>(rows, schema, mapping)`, `<ImportPreviewModal />` (generic over row type)
- [ ] `<ImportPreviewModal />` accepts: `parsedRows`, `validRows`, `invalidRows`, `columnMapping`, `onConfirm`, `onCancel`, `mode: 'partial' | 'all-or-nothing'` (default `partial`)
- [ ] Existing spot CSV import flow (`src/features/spot/SpotPanel.tsx` + the old `ImportPreviewModal.tsx` call sites) is migrated to use the shared module — visual + behavioral parity
- [ ] Spot CSV happy-path test (`src/features/spot/__tests__/...`) still passes; new tests cover the generic module separately
- [ ] No regression in spot CSV: same column mapping, same error-row rendering, same partial-import behavior
- [ ] No file > 250 lines
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green

## Files touched

**New:**
- `src/lib/csv/parse.ts` — `parseCsv(text, options)` (move existing CSV parsing logic here)
- `src/lib/csv/validate.ts` — `validateRows<T>(rows, schema, mapping): { valid: T[], invalid: Array<{ row: unknown, errors: string[] }> }`
- `src/lib/csv/ImportPreviewModal.tsx` — generic modal (≤ 200 lines)
- `src/lib/csv/types.ts` — `ColumnMapping`, `ParsedCsvRow`, `ImportPreviewProps<T>`
- `src/lib/csv/__tests__/parse.test.ts`, `validate.test.ts`, `ImportPreviewModal.test.tsx`

**Edited:**
- `src/features/spot/SpotPanel.tsx` — import the shared modal + helpers
- `src/features/spot/ImportPreviewModal.tsx` — replace internals with a thin wrapper that supplies the spot-specific schema + mapping; or delete entirely if the call site can use the generic directly

**Deleted (after migration verified):**
- `src/features/spot/ImportPreviewModal.tsx` (only if call sites no longer reference it)

## Out of scope

- Ledger CSV import itself (next spec)
- Adding a CSV library dependency (the spot import already works without one — preserve that)
- Streaming / chunked imports for huge files
- Server-side parsing
- Excel / XLSX support

## Implementation notes

- Inspect the current `src/features/spot/ImportPreviewModal.tsx` (90 lines) and `SpotPanel.tsx` to identify the boundary: `parseCsv` and the modal are clearly generic; the column mapping (`date,asset,amount,...`) and zod row schema are spot-specific.
- The generic modal must NOT reference `SpotLot` types. Use TypeScript generics so consumers pass their row type.
- Keep error-row rendering verbatim from the existing implementation — this is the part users have already learned.
- Ledger consumers will pass three different schemas (transactions / vault prices / agent equity); design the generic with that in mind.

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
grep -Rn "SpotLot\|spot_lots" src/lib/csv   # expect: empty (generic module must not know about spot)
find src/lib/csv -type f | xargs wc -l | awk '$1 > 250'   # expect: empty
```

Browser smoke:
- Spot CSV import: open the modal, paste a 5-row mixed-quality CSV, valid rows preview, invalid rows show row-level errors, confirm → rows imported. Visual + behavioral parity with current behavior

Regression: spot CSV happy path + error path unchanged; spot tests pass.

Final step: rename `docs/backlog/todo.ledger-csv-shared-refactor.md` → `docs/backlog/done.ledger-csv-shared-refactor.md`.
