#!/usr/bin/env node
/**
 * dev-daemon.mjs — launch a long-running dev service detached from this shell.
 *
 * Motivation: terminal wrappers kill the whole process group when a command
 * exits, so `nohup x &` dies with the shell. Node's `detached: true` spawn puts
 * the child in a new process group AND session (POSIX), so it survives.
 *
 * Usage:
 *   node dev-daemon.mjs --name rxsoft --cwd /path/to/pkg --log /tmp/x.log -- yarn start:dev
 *   node dev-daemon.mjs --stop rxsoft           # stop a previously started service
 *   node dev-daemon.mjs --status                # list managed services
 *
 * State: /tmp/rxsoft-e2e-daemons.json (pidfile map, no secrets).
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { openSync } from 'node:fs';

const STATE_FILE = '/tmp/rxsoft-e2e-daemons.json';

function readState() {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') break;
    if (a === '--name') args.name = argv[++i];
    else if (a === '--cwd') args.cwd = argv[++i];
    else if (a === '--log') args.log = argv[++i];
    else if (a === '--stop') args.stop = argv[++i];
    else if (a === '--status') args.status = true;
    else if (a === '--wait-port') args.waitPort = Number(argv[++i]);
    else args._.push(a);
  }
  // Everything after `--` is the command; handle re-scan since we broke early.
  const dd = argv.indexOf('--');
  if (dd !== -1) args.cmd = argv.slice(dd + 1);
  return args;
}

const args = parseArgs(process.argv.slice(2));
const state = readState();

if (args.status) {
  for (const [name, entry] of Object.entries(state)) {
    const alive = isAlive(entry.pid);
    console.log(`${name}: pid ${entry.pid} ${alive ? 'RUNNING' : 'DEAD'} (log: ${entry.log})`);
  }
  if (Object.keys(state).length === 0) console.log('(no managed services)');
  process.exit(0);
}

if (args.stop) {
  const entry = state[args.stop];
  if (!entry) {
    console.error(`no managed service named ${args.stop}`);
    process.exit(1);
  }
  try {
    process.kill(-entry.pid, 'SIGTERM'); // negative pid = whole process group
    console.log(`stopped ${args.stop} (pid ${entry.pid})`);
  } catch (err) {
    console.warn(`kill failed (${err.message}); removing stale entry`);
  }
  delete state[args.stop];
  writeState(state);
  process.exit(0);
}

if (!args.name || !args.cmd || args.cmd.length === 0) {
  console.error('usage: dev-daemon.mjs --name <svc> [--cwd <dir>] [--log <file>] -- <cmd...>');
  process.exit(1);
}

// Replace an existing dead entry; refuse to double-start a live one.
const existing = state[args.name];
if (existing && isAlive(existing.pid)) {
  console.log(`${args.name} already running (pid ${existing.pid})`);
  process.exit(0);
}

const logPath = args.log ?? `/tmp/${args.name}.log`;
const out = openSync(logPath, 'a');
const child = spawn(args.cmd[0], args.cmd.slice(1), {
  cwd: args.cwd ?? process.cwd(),
  detached: true,
  stdio: ['ignore', out, out],
  env: process.env,
});
child.unref();

state[args.name] = {
  pid: child.pid,
  log: logPath,
  cmd: args.cmd.join(' '),
  startedAt: new Date().toISOString(),
};
writeState(state);
console.log(`started ${args.name} (pid ${child.pid}, log ${logPath})`);
