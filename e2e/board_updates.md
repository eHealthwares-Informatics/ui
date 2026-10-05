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
| 2026-09-29 | VAL-01…VAL-04 (schema_validation_task.md §4.2) | create-issue | new epic/UC entries under items epic | **Done** (applied 2026-10-05) | Created ehealthwares/rxsoft#771 (UC-RX-ITEMS-VAL-01, parent #28, all 4 TCs ticked — e2e green 2026-10-05). Org board eHealthwares-Informatics/projects/1 + tracker RxSoft Alpha Test Plan: Status=Todo. |
| 2026-09-29 | TC-RX-ITEMS-REC-01 (item_creation_view.md §3.3) | create-issue + tick-box | under items epic | **Partial** (issue created 2026-10-05; tick-box blocked) | Created ehealthwares/rxsoft#772 (UC-RX-ITEMS-REC-01, parent #28). REC-01 spec added to items-wizard.spec.ts; e2e FAILED — ListItemsDto still defaults sortBy=name/sortOrder=asc (repository createdAt fallback unreachable). Root cause + 2-line fix documented on #772. **TC not ticked (C12).** |
| 2026-09-29 | Testids task → cross-cutting issue | create-issue | new issue in eHealthwares-Informatics/ui | **Done** (applied 2026-10-05) | Created eHealthwares-Informatics/ui#68 (spec: data_test_id_task.md). Org board + Status=Todo. |
| 2026-10-05 | UC-RX-ITEMS-VAL-01 #771 | close-issue + update-status | ehealthwares/rxsoft#771; org board eHealthwares-Informatics/projects/1 + tracker RxSoft Alpha Test Plan → Status=Done | **Pending scrum-master** (issue closed directly 2026-10-05 by org agent, user stated resolved in-thread; board Status field move still queued) | VAL verified green 2026-10-05 — 22 passed / 1 honest skip / 0 failed |
| 2026-10-05 | UC-RX-ITEMS-REC-01 #772 | update-counter | ehealthwares/rxsoft#772 | **Blocked — do NOT tick** | Backend fix PR #38 (eHealthwares-Informatics/rxsoft) MERGED to main — `list-items.dto.ts` defaults confirmed on-disk as `sortBy=createdAt` / `sortOrder=desc` (backend main@28845c3, tree clean). Buffy polled rxsoft :8080 for 20 min (16:12–16:32) — **never came up (000)**; e2e re-run could not execute. TC-RX-ITEMS-REC-01 remains **unticked** (honesty rule C12). Re-queue/re-run once :8080 is restarted. |

---

## Done log

(Scrum-master: move rows here when applied, keep date of application.)

- 2026-09-28 — phase-2 18/18 ticked + UC closes (historical rows above).
- 2026-10-05 — VAL UC #771 created + verified green (board rows applied, gh account ehealthwares); testids ui#68 created; REC-01 UC #772 created (tick blocked on red e2e, root cause logged).
- 2026-10-05 — REC-01 re-run attempt: rxsoft :8080 unavailable for the full 20-min readiness window (16:12–16:32); backend fix confirmed on-disk but e2e could not run. **No tick, no close.** Next UC identified: #34 UC-RX-ITEMS-WIZARD-01 (spec `tests/rxsoft/items-create.spec.ts`, not yet gated/testid-audited).
