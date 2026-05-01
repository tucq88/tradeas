# lot-remove — delete a spot lot

**Epic**: standalone · **Phase**: — · **Severity**: 🟡 · **Depends on**: spot-ux-v2, polish-v1

## Goal

Allow removing a spot lot entirely (e.g. a mistake or test entry) so it doesn't skew portfolio numbers. Destructive, so requires a two-click inline confirm matching the existing "done" flow pattern.

## Acceptance criteria

- [ ] "remove" button appears in LotRow alongside "edit" and "mark done"
- [ ] Clicking "remove" transitions LotRow to a confirm state (inline, no modal)
- [ ] Confirm state shows a prompt + "confirm remove" button + "cancel" button
- [ ] Confirming deletes the lot from Supabase and removes it from the query cache immediately
- [ ] Cancel returns to display mode with no change
- [ ] Works for both WIP and Done lots
- [ ] `spotLots.remove(id)` added to the DAL
- [ ] `yarn typecheck && yarn lint && yarn test && yarn build` green

## Files touched

- `src/data/spotLots.ts` — add `remove(id)` method
- `src/features/spot/LotRow.tsx` — add `'remove'` mode with inline confirm UI

## Out of scope

- Undo / soft delete
- Confirmation for "done" lots vs WIP lots (same UX for both)
- Bulk remove

## Implementation notes

- Supabase delete: `.delete().eq('id', id)` — no `.select()` needed, returns no data
- Cache update: `qc.setQueryData<SpotLot[]>(['spot-lots'], (old) => (old ?? []).filter(l => l.id !== id))`
- Follow the existing `mode === 'done'` pattern: a `removeMutation`, `enterRemove()` setter, inline JSX branch
- Button label: "remove" (lowercase, consistent with "edit" / "mark done")

## Verification

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

Browser smoke:
- Add a test lot → click "remove" → confirm state appears, cancel returns to display
- Confirm remove → lot disappears from list, portfolio aggregation updates
- Regression: "edit" and "mark done" still work on adjacent lots
