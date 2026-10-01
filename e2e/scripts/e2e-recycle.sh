#!/bin/sh
# e2e-recycle.sh — one-command clean slate for the e2e environment.
#
# Implements the "recycle after ~1 hour / before long suites" recommendation:
# nest/vite watchers grow, Chromium processes linger after crashed tests,
# /tmp logs bloat, and load-avg creeps up until Playwright times out on green
# tests (2026-10-01: load 29.6 → 6 spurious failures; restart fixed them).
#
# Usage:  sh frontend/e2e/scripts/e2e-recycle.sh        (from repo root or frontend/)
#         Freewipes ONLY e2e-managed daemons — never touches your own processes.
set -e
# Non-interactive shells after a Freebuff restart lack the user's nvm/homebrew
# PATH — rebuild it before invoking node (trap observed 2026-10-01).
if ! command -v node >/dev/null 2>&1 || ! command -v yarn >/dev/null 2>&1; then
  for candidate in "$HOME"/.nvm/versions/node/*/bin /opt/homebrew/bin /usr/local/bin; do
    for dir in $candidate; do
      if [ -x "$dir/node" ] || [ -x "$dir/yarn" ]; then PATH="$dir:$PATH"; fi
    done
  done
fi
# yarn 4 (corepack) needs corepack shims on PATH too; fall back to npx --yes yarn.
command -v corepack >/dev/null 2>&1 && corepack enable 2>/dev/null || true
export PATH
DD="$(dirname "$0")/../tracker/dev-daemon.mjs"
FRONTEND="$(cd "$(dirname "$0")/../.." && pwd)"
MONO="$(cd "$FRONTEND/.." && pwd)"

echo "[recycle] stopping e2e daemons…"
for svc in pw-regression pw-regression2 pw-regression3 pw-setup vite-5173 rxsoft-8080 identity-8092 seed-8093 emr-8093; do
  node "$DD" --stop "$svc" 2>/dev/null || true
done

echo "[recycle] killing orphaned headless browsers…"
pkill -f headless_shell 2>/dev/null || true
pkill -f "chrom.*--headless" 2>/dev/null || true

echo "[recycle] restarting postgres…"
docker restart postgres_db
sleep 8

echo "[recycle] starting services…"
node "$DD" --name rxsoft-8080  --cwd "$MONO/rxsoft"   --log /tmp/rxsoft-8080.log  -- env PORT=8080 yarn start:dev
node "$DD" --name identity-8092 --cwd "$MONO/identity" --log /tmp/identity-8092.log -- env PORT=8092 npm run start:dev
node "$DD" --name seed-8093    --cwd "$MONO/seed"     --log /tmp/seed-8093.log    -- env PORT=8093 npm run start:dev
node "$DD" --name vite-5173    --cwd "$FRONTEND"      --log /tmp/vite-5173.log    -- env PORT=5173 yarn dev --host

echo "[recycle] waiting for readiness…"
sleep 35
for probe in "http://localhost:8080/api/health rxsoft" "http://localhost:8092/docs identity" "http://localhost:8093/api seed" "http://localhost:5173/ vite"; do
  set -- $probe
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$1")
  echo "  $2: $code"
done
echo "[recycle] done. Run preflight to confirm: node e2e/scripts/preflight.mjs"
