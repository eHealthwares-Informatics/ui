# Orphaned E2E org — detection & manual cleanup

> **This is a manual workaround, not a fix.** `seed#15` + `seed#16` are the real fix.
> Until both land, every run that fails to deprovision leaks one org plus thousands
> of rows. Last updated 2026-10-10.

## 1. Detect

Teardown prints:

```
[global-teardown] deprovision NOT confirmed for <CODE> (seed answered non-2xx or deprovisioned:false) — org may remain provisioned
```

Confirm it's genuinely still alive (seed is on **:8094**, not :8093):

```bash
curl -s http://localhost:8094/api/provision/<CODE>
# {"exists":true, ...}   → still there, needs cleanup
# {"exists":false, ...}  → already gone, stop here
```

## 2. Why the API can't clean it

`DELETE /api/provision/<CODE>` returns `deprovisioned:false, status:partial, deleted:0`
with two hard failures:

| failure | issue | what it is |
|---|---|---|
| `[identity].auth_action_tokens` → `42P01 relation does not exist` | **seed#15** | targets a table absent from this environment; hard-fails the whole identity pass |
| `[backend].stock_lots` → `57014 statement timeout` | **seed#16** | org-scoped DELETE can't finish in the 20s budget |

**seed#16's root cause is missing indexes.** `stock_lots.lot_id` is FK-referenced by
`stock_balances` (**94 MB**), `stock_movements` (9.5 MB) and `sale_lines` (4.7 MB) —
and **none of those three `lot_id` columns was indexed**. `stock_lots.organization_id`
*is* indexed (`uq_stock_lots_org_code`), so finding rows is fast; **100% of the cost is
the per-row referential check seq-scanning `stock_balances`.**

Measured on 2026-10-10 (org `E2E-20261010-ARCWLS`, 37,442 `stock_lots` rows):

| | unindexed | indexed |
|---|---|---|
| 5,000-row batched DELETE | **0 batches completed in 6+ min** | 8 batches / **37,442 rows in seconds** |

## 3. Scope it — always before deleting

Bound every query to one `organizationId`. Get it from the seed response above.

```sql
-- rxsoft: which org-scoped tables hold rows?
select table_name from information_schema.columns
 where table_schema='public' and column_name='organization_id' order by 1;

-- exact counts for THIS org (never a blanket delete)
select 'stock_lots' tbl, count(*) from stock_lots where organization_id='<ORG_ID>' union all
select 'gl_accounts', count(*) from gl_accounts where organization_id='<ORG_ID>' union all
select 'audit_logs', count(*) from audit_logs where organization_id='<ORG_ID>';
```

## 4. Cleanup

Add the indexes **first** — without them the delete will not finish.

```sql
CREATE INDEX CONCURRENTLY ix_stock_balances_lot_id  ON stock_balances  (lot_id);
CREATE INDEX CONCURRENTLY ix_stock_movements_lot_id ON stock_movements (lot_id);
CREATE INDEX CONCURRENTLY ix_sale_lines_lot_id      ON sale_lines      (lot_id);
```

Then batch the big delete so no single statement blows the budget:

```sql
-- repeat until it returns 0
WITH d AS (DELETE FROM stock_lots WHERE ctid IN
  (SELECT ctid FROM stock_lots WHERE organization_id='<ORG_ID>' LIMIT 5000)
  RETURNING 1)
SELECT count(*) FROM d;
```

Then the small tables, **children before the org record**:

```sql
DELETE FROM gl_accounts     WHERE organization_id='<ORG_ID>';
DELETE FROM audit_logs      WHERE organization_id='<ORG_ID>';
-- identity db, last:
DELETE FROM organizations   WHERE id='<ORG_ID>';
```

## 5. Verify

```sql
select count(*) from stock_lots where organization_id='<ORG_ID>';   -- expect 0
```
```bash
curl -s http://localhost:8094/api/provision/<CODE>   # expect {"exists":false,...}
```

Sanity-check the table total dropped by exactly the number you deleted.

## 6. Gotchas hit while doing this

- **Postgres Docker path is not on PATH** for non-interactive shells:
  `/Applications/Docker.app/Contents/Resources/bin/docker exec -i postgres_db psql -U postgres -d rxsoft`
- **zsh does not word-split unquoted variables.** `PSQL_RX="$PG exec ... psql ..."` then
  `$PSQL_RX "query"` fails with `no such file or directory: <whole string>`. Use a shell
  **function**, not a string variable.
- **`kill <script-pid>` does not kill the child `psql`.** A batch can commit *after* your
  verification query — re-check counts after a settle delay instead of asserting "unchanged"
  from a stale read.
- The three indexes above are **not in a migration**. A schema reset/rebuild loses them and
  seed#16 recurs. Landing them in the entity definitions is part of #16.
