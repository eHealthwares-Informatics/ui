# Board updates queue — for the scrum-master agent

**Purpose**: Single hand-off point for GitHub-board mutations discovered during QA work. Buffy (QA agent) appends rows here; the **scrum-master agent** (`/Users/john/develop/AIOS/core/agents/shared/scrum-master`) consumes this file, applies the updates, and moves rows to Done.

**Rule (now also in root AGENTS.md, rule 3 of "Alpha QA workflow rules")**: Buffy must **not** apply board mutations ad hoc. Exceptions requiring explicit user request in-thread: `--write-back` / `--update-issues` runs of `board-sync.mjs`, and any `gh issue`/`gh pr` call.

---

## Format

One row per atomic board action:

```
| <date> | <TC/UC id or issue #> | <action> | <target issue(s)> | <status> | <notes> |
```

Actions: `tick-box`, `close-issue` (always `--reason completed`), `reopen`, `comment`, `create-issue`, `update-counter`.

---

## Queue

| Date | Item | Action | Target | Status | Notes |
|---|---|---|---|---|---|
| 2026-09-29 | TC-RX-ITEMS-01…16,22,23 (18 TCs) | tick-box | ui tracker → issues #29–33 | **Done** (applied 2026-09-28, pre-queue) | Historical entry: phase-2 write-back, 3 passes, last via `--no-cache`. Verified on board. |
| 2026-09-29 | UC items sub-issues #29–33 + 20 gated-complete delete UCs | close-issue | ehealthwares/rxsoft issues #46 #53 #63 #70 #84 #97 #121 #128 #140 #147 #166 #181 #219 #238 #249 #262 #283 #290 #297 #314 | **Done** (applied 2026-09-28, pre-queue) | Historical entry: close-uc branch fixed to real `gh issue close --reason completed`. Verified. |
| 2026-09-29 | VAL-01…VAL-04 (schema_validation_task.md §4.2) | create-issue | new epic/UC entries under items epic | **Pending** | Create after validation task lands so TC text matches shipped behavior. |
| 2026-09-29 | TC-RX-ITEMS-REC-01 (item_creation_view.md §3.3) | create-issue + tick-box | under items epic | **Pending** | Create + tick only after e2e green. |
| 2026-09-29 | Testids task → cross-cutting issue | create-issue | new issue in eHealthwares-Informatics/ui | **Pending** | Reference data_test_id_task.md as spec. |

---

## Done log

(Scrum-master: move rows here when applied, keep date of application.)

- 2026-09-28 — phase-2 18/18 ticked + UC closes (historical rows above).
