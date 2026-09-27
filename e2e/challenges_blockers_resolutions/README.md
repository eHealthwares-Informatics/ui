# Challenges · Blockers · Resolutions

Run learnings for the RxSoft e2e suite. **Every run must read [`INDEX.md`](./INDEX.md)
before starting** and **append entries here while working** — not after the fact.

## Why

The same pitfall (a service silently binding port 0, a provisioning call going
out unsigned, a mocked page waiting on an endpoint nobody mocked) costs an hour
the first time and five seconds the second time — but only if the second run
actually knows to look.

## Convention

One file per phase (`phase-0.md`, `phase-1.md`, …) plus topical files when a
problem spans phases. Each entry:

```markdown
## <short title>            <!-- one line, searchable -->
- **Phase:** <n> · <date>
- **Challenge:** what we were trying to do
- **Blocker:** what actually stopped us (error text, behaviour)
- **Resolution:** what fixed it (command, code, config)
- **Prevention:** how future runs detect/avoid this in seconds
```

Then add one line to [`INDEX.md`](./INDEX.md):

```
| <title> | phase-0.md | resolved | port binding / auth / mocks |
```

Statuses: `open` (blocking or unresolved) · `resolved` · `accepted` (known
limitation, documented, not worth fixing).

## Rules

- Write the entry **when you hit the problem**, while the fix is fresh — a
  resolution remembered "later" is usually wrong.
- Never record secret values (keys, tokens, passwords). Reference the env var
  or file, not the value.
- A lesson that generalizes beyond this repo gets promoted into the AIOS QA
  skills (`core/skills/qa/…` in the AIOS repo) and the promotion noted here.
- Before debugging anything that smells familiar, grep this folder first.
