# Task: Newly created items must appear at the top of the list

**Status**: Spec ready for implementation
**Priority**: High — direct user pain ("created items appear at the top") + unblocks e2e assertions
**Owner**: rxsoft (API default sort) + frontend (default sort UI) + e2e
**Requested by**: John — *"create ticket to make sure created items appear at the top and changes needed to make sure e2e is updated too"*

---

## 1. Problem statement

After creating an item in a 39k-row global catalog, the item is nowhere near the top of the list. The default list sort is **alphabetical by name** — a new row lands mid-alphabet, usually on a deep page, invisible to both users and e2e assertions.

This is the same data-scale trap documented as phase-1/2 challenge theme 4: "GET /items is a 39k-row catalog at 10/page → created row never on page 1; search before asserting."

## 2. Root cause (verified in source)

[typeorm-item.repository.ts:92–102](../../../rxsoft/src/modules/catalog/repositories/typeorm-item.repository.ts#L92-L102):

```ts
const sortBy = ALLOWED_SORT_COLUMNS.includes(query.sortBy) ? query.sortBy : 'name';
if (sortBy === 'code') { ... }
else {
  qb.orderBy(`product.${sortBy === 'createdAt' ? 'createdAt' : 'name'}`, ...);
}
qb.addOrderBy('product.name', 'ASC');
```

- Default `sortBy` falls back to `'name'` → `product.name ASC`.
- The code *already supports* `sortBy: 'createdAt'` (line 98), so the fix is a default change, not a feature build — plus `ALLOWED_SORT_COLUMNS` must contain `createdAt` (verify; add if missing).
- Frontend items page issues its first list query without an explicit sort → inherits the API default.

## 3. Changes

### 3.1 rxsoft API

1. `typeorm-item.repository.ts` — default sort becomes `product.createdAt DESC` with stable tiebreak `.addOrderBy('product.name', 'ASC')` (keep). Add `'createdAt'` to `ALLOWED_SORT_COLUMNS` if absent.
2. Update `typeorm-item.repository.spec.ts` — assert default ordering is createdAt DESC.
3. Check other rxsoft list repos for the same alphabetical-default pattern while in here (price lists, warehouses, categories) — apply the same default where "recency first" is the sensible UX. List them in this doc as done.

### 3.2 frontend

1. Items page default query: request `sortBy=createdAt&sortOrder=DESC` explicitly (don't rely on server default alone, but keep server default in sync).
2. List header sort control: offer "Newest first" as the default option; alphabetical stays available.

### 3.3 e2e updates

1. **New TC `TC-RX-ITEMS-REC-01`** — create item → (without searching) the row is visible on page 1, ideally first row: `data-table-row` first contains the created name. This turns phase-2 TC-03's empty-catalog self-skip and TC-12's search-before-assert workaround into a real assertion.
2. items-wizard.spec.ts TC-12 keeps its search-before-assert (defense in depth), but add the REC-01 assertion right after create in the create TC itself.
3. Update the crud-suite template: after-create assertion becomes "row visible at top" (search fallback retained behind a flag for screens not yet default-sorted).
4. Revisit TC-03 (pagination self-skip): with recency sort, the "pagination shows new rows" TC can run unconditionally once REC behavior ships — remove the self-skip.

## 4. Acceptance criteria

- [ ] POST /items then GET /items (no params beyond paging): created item is in the first page, first row (createdAt DESC)
- [ ] Repository unit test asserts the default ordering
- [ ] e2e REC-01 green in items-wizard.spec.ts; TC-03 self-skip removed
- [ ] Alphabetical sort still selectable and correct (code path untouched)
- [ ] Same default audited for ≥3 other rxsoft list endpoints; results recorded here

## 5. Estimate

| Chunk | Size |
|---|---|
| rxsoft repo default + unit test | 0.5 day |
| Frontend default sort + control | 0.5 day |
| e2e REC-01 + template update | 0.5 day |
| Sweep of other list endpoints | 0.5 day |
| **Total** | **~2 dev-days** |

---

## Board note

Track as rxsoft + ui issue pair. When picked up, add the ticket numbers here and queue status changes through [../board_updates.md](../board_updates.md) (scrum-master flow).
