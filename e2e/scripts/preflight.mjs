#!/usr/bin/env node
/**
 * preflight.mjs — gate a Playwright run on machine + service health.
 *
 * The "handover trap": long dev sessions degrade (watcher memory, orphaned
 * Chromium processes, chatty logs) and load-avg > ~10 produces rotating test
 * timeouts that LOOK like app bugs (2026-09-30 incident: load 216; 2026-10-01
 * run 2: load 29.6 → 6 failures incl. previously-green tests).
 *
 * Usage:
 *   node e2e/scripts/preflight.mjs              # check only (exit 1 on red)
 *   node e2e/scripts/preflight.mjs --recycle    # recycle services, re-check
 *   node e2e/scripts/preflight.mjs --json       # machine-readable output
 *
 * Exit codes: 0 = go, 1 = blocked (fix env first).
 */
import { execFileSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const shouldRecycle = args.has('--recycle');

const LIMITS = {
  /** 1-min load average ceiling (per-core agnostic; M-series Mac ~10 cores) */
  load1: 12,
  /** A long-running test browser whose CPU is stuck > 0 with no suite attached */
  zombieChromiumTolerance: 0,
};

function sh(cmd, opts = {}) {
  try {
    return execFileSync(cmd[0], cmd.slice(1), { encoding: 'utf-8', ...opts }).trim();
  } catch (err) {
    return err.stdout?.trim?.() ?? '';
  }
}

function load1() {
  // "10:37  up 2 days, 17 mins, 1 user, load averages: 14.02 11.96 11.15"
  const m = sh(['uptime']).match(/load averages?:\s*([\d.]+)/);
  return m ? Number(m[1]) : null;
}

function zombieChromium() {
  const out = sh(['sh', '-c', "ps ax -o pid,comm | grep -i -E 'chrom|headless_shell' | grep -v grep | wc -l"]);
  return Number(out) || 0;
}

const SERVICES = [
  { name: 'postgres', url: null, cmd: ['docker', 'ps', '--format', '{{.Names}} {{.Status}}'], match: /postgres_db Up.*(healthy)/ },
  { name: 'rxsoft',   url: 'http://localhost:8080/api/health' },
  { name: 'identity', url: 'http://localhost:8092/docs' },
  { name: 'seed',     url: 'http://localhost:8093/api' }, // 404 = alive
  { name: 'vite',     url: 'http://localhost:5173/' },
];

function probe(url) {
  const code = sh(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '5', url]);
  return code === '000' ? false : Number(code) > 0; // any HTTP answer = alive
}

function checkAll() {
  const results = [];
  const l = load1();
  results.push({ check: 'load1', value: l, ok: l !== null && l <= LIMITS.load1, hint: `load ${l} > ${LIMITS.load1} — wait or run e2e-recycle.sh (documented rotating-timeout trap)` });

  const z = zombieChromium();
  results.push({ check: 'zombie-browsers', value: z, ok: z <= LIMITS.zombieChromiumTolerance, hint: `${z} orphan Chromium processes — run e2e/scripts/e2e-recycle.sh` });

  for (const s of SERVICES) {
    if (s.url) {
      const ok = probe(s.url);
      results.push({ check: `service:${s.name}`, value: ok ? 'up' : 'down', ok, hint: `${s.name} down — run e2e/scripts/e2e-recycle.sh` });
    } else {
      const out = sh(s.cmd);
      const ok = s.match.test(out);
      results.push({ check: `service:${s.name}`, value: ok ? 'up' : 'down', ok, hint: 'postgres container not healthy — docker compose up -d / docker restart postgres_db' });
    }
  }
  return results;
}

function recycle() {
  console.error('[preflight] recycling dev services (db restart + daemon restarts)…');
  sh(['sh', '-c', 'node e2e/tracker/dev-daemon.mjs --stop pw-regression 2>/dev/null; node e2e/tracker/dev-daemon.mjs --stop vite-5173 2>/dev/null; node e2e/tracker/dev-daemon.mjs --stop rxsoft-8080 2>/dev/null; node e2e/tracker/dev-daemon.mjs --stop identity-8092 2>/dev/null; node e2e/tracker/dev-daemon.mjs --stop seed-8093 2>/dev/null; docker restart postgres_db']);
  sh(['sh', '-c', 'sleep 8']);
  sh(['sh', '-c', 'node e2e/tracker/dev-daemon.mjs --name rxsoft-8080 --cwd ../rxsoft --log /tmp/rxsoft-8080.log -- env PORT=8080 yarn start:dev']);
  sh(['sh', '-c', 'node e2e/tracker/dev-daemon.mjs --name identity-8092 --cwd ../identity --log /tmp/identity-8092.log -- env PORT=8092 npm run start:dev']);
  sh(['sh', '-c', 'node e2e/tracker/dev-daemon.mjs --name seed-8093 --cwd ../seed --log /tmp/seed-8093.log -- env PORT=8093 npm run start:dev']);
  sh(['sh', '-c', 'node e2e/tracker/dev-daemon.mjs --name vite-5173 --cwd . --log /tmp/vite-5173.log -- env PORT=5173 yarn dev --host']);
  sh(['sh', '-c', 'sleep 35']);
}

let results = checkAll();
if (shouldRecycle && !results.every((r) => r.ok)) {
  recycle();
  results = checkAll();
}

const failed = results.filter((r) => !r.ok);
if (asJson) {
  console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
} else if (failed.length === 0) {
  console.log(`[preflight] GO — ${results.map((r) => `${r.check}=${r.value}`).join(' ')}`);
} else {
  console.error('[preflight] NO-GO:');
  for (const f of failed) console.error(`  ✗ ${f.check}: ${f.hint}`);
  console.error('  → e2e/scripts/e2e-recycle.sh, or wait for load to drop before re-running.');
  process.exit(1);
}
