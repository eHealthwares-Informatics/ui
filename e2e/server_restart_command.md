# Server restart commands + troubleshooting

**Rule (AGENTS.md, "Alpha QA workflow rules (always)", rule 4)**: after a Freebuff restart or when services are dead, the agent outputs the quick-start block below and **waits — the user runs the commands**. The agent does not start daemons for now.

---

## Quick start (run these after every Freebuff restart)

```bash
# 0. Docker (needed by rxsoft/identity Postgres, conversation Mongo replica set)
open -a Docker

# 1. rxsoft API  — :8080, global prefix /api
cd rxsoft && PORT=8080 yarn start:dev

# 2. identity API — :8092
cd identity && npm run start:dev

# 3. seed service — :8094 (EMR owns :8093; SEED_API_KEY lives in seed/.env)
cd seed && npm run start:dev

# 4. frontend Vite — :5173 (always via dev-daemon so Playwright can reuse it)
cd frontend && node e2e/tracker/dev-daemon.mjs --name vite-5173 --cwd "$PWD" --log /tmp/vite-5173.log -- yarn dev --host
```

Optionally wrap 1–3 in dev-daemon too (survives nothing across Freebuff restarts, but gives logs):

```bash
cd rxsoft && node ../frontend/e2e/tracker/dev-daemon.mjs --name rxsoft-8080 --cwd "$PWD" --log /tmp/rxsoft-8080.log -- env PORT=8080 yarn start:dev
```

### Readiness probes

```bash
lsof -i :8080 -i :8092 -i :8093 -i :8094 -i :5173   # EMR :8093, seed :8094
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/api/health   # any HTTP code = alive; 404 counts
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/
```

---

## Troubleshooting

### Port already in use
```bash
lsof -ti:8080 | xargs kill -9    # then restart the service
```
Symptom: `EADDRINUSE`. Happens when a daemon survived but its registration did not — dev-daemon `--name` reuse will attach to the survivor.

### Docker not ready yet
`open -a Docker` returns immediately; Postgres containers fail until the engine is up. Wait ~20s, check `docker ps`, then start rxsoft/identity. Symptom: backend logs `ECONNREFUSED` on :5432.

### Playwright webServer conflict (the phase-2 lesson)
Playwright's own `webServer` dies on long runs and orphan-booted Vite can vanish mid-suite. **Always** run Vite via dev-daemon with `reuseExistingServer` and point the config at it. Run Playwright through dev-daemon as well:

```bash
cd frontend && KEY=$(grep '^SEED_API_KEY=' ../seed/.env | cut -d= -f2) && \
node e2e/tracker/dev-daemon.mjs --name pw-X --cwd "$PWD" --log /tmp/pw-X.log -- \
  env SEED_PROVISION_API_KEY="$KEY" npx playwright test --config e2e/playwright.config.ts \
  --project=setup --project=admin tests/rxsoft/items-wizard.spec.ts --retries=1 --reporter=list
```

### Missing SEED_API_KEY → provision failures
e2e `global-setup.ts` provisions a fresh org via seed `POST /api/provision` (x-api-key). If the key env is missing or seed (:8094) is down, setup fails and the run falls back to DEFAULT org `admin`/`password`. Always export `SEED_PROVISION_API_KEY` from `seed/.env` (see command above).

### Login / token notes (do NOT debug login in the preview browser)
- Login returns `{accessToken, refreshToken}`; localStorage keys: `rxsoft_admin_access_token`, `rxsoft_admin_refresh_token`; auth-store `bootstrap()` needs **both**.
- Manually injected OWNER tokens still hit /403 (modules:[]) — don't chase this in the preview browser; the default-filled sign-in form silently won't submit there either. Probe specs via `auth.setup` are the reliable diagnostic.

### High load → timeouts that look like app bugs
Serial Playwright + retries re-runs whole describe groups; under load a different test times out each pass (incident: load-avg 216 vs 9 normal). Check `uptime` / `sysctl vm.loadavg` before re-running; wait for load to drop instead of "fixing" the test.

### Stale /tmp logs and daemon state
Freebuff restarts kill daemons and orphan /tmp logs. `rm -f /tmp/pw-*.log /tmp/vite*.log` before a fresh session if logs mislead; tail the daemon log when a service "won't start" — the reason is in the log file, not the terminal.

### What a Freebuff restart wipes
- all background daemons/dev servers (restart from Quick start)
- /tmp logs
- preview-panel registrations (re-register after servers are back)

### Other stacks (only when needed)
- conversation: needs the Mongo **replica set** for change streams — `cd conversation && docker compose up -d`, then `npm run start:dev` (:8090)
- concepts :3011 (`npm run start:dev`), interop :3000 (`npm run dev`), emr :8093. Seed is :8094 (SEED_PORT); do not put seed back on :8093.

### Baseline expectations when healthy
| Service | Port | Healthy signal |
|---|---|---|
| rxsoft | 8080 | any HTTP on `/api/*` (404 fine) |
| identity | 8092 | any HTTP |
| seed | 8094 | any HTTP; `/api/provision` needs x-api-key |
| emr | 8093 | any HTTP (frontend VITE_EMR_API_URL) |
| vite | 5173 | 200 on `/` |
| Postgres (rxsoft+identity DBs) | 5432 | `docker ps` shows both containers up |
| Mongo replica set | 27017+ | only for conversation module work |
