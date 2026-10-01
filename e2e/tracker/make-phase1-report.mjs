#!/usr/bin/env node
/**
 * make-phase1-report.mjs — renders e2e/reports/phase1-status.html from a
 * Playwright list-reporter log so results are visible in the preview panel.
 * Usage: node make-phase1-report.mjs /tmp/pw-p1final.log [out.html]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const logPath = process.argv[2] ?? '/tmp/pw-p1final.log';
const outPath = process.argv[3] ?? join(HERE, '..', 'reports', 'phase1-status.html');

const text = readFileSync(logPath, 'utf-8');
const lines = text.split('\n');

const results = []; // { pass, title, ms, retry }
const lineRe = /^  ([✓✘-])\s+(\d+)\s+\[(admin|setup)\]\s+›\s+(.+?)(?:\s+\((?:retry #\d+ )?([\d.]+)s\))?\s*$/;
for (const ln of lines) {
  const m = lineRe.exec(ln);
  if (!m) continue;
  const [, mark, , proj, rest, secs] = m;
  if (proj === 'setup') continue;
  const retry = /retry #\d+/.test(ln);
  results.push({ pass: mark === '✓', fail: mark === '✘', retry, title: rest.trim(), secs: secs ? Number(secs) : null });
}

// collapse retries: keep worst outcome per test
const byTitle = new Map();
for (const r of results) {
  const key = r.title;
  const prev = byTitle.get(key);
  if (!prev) byTitle.set(key, r);
  else {
    prev.fail = prev.fail || r.fail;
    prev.retry = prev.retry || r.retry;
    prev.pass = prev.pass && r.pass;
  }
}
const tests = [...byTitle.values()];

const crud = {};
for (const t of tests) {
  const m = /RxSoft CRUD: (.+?) › (.+)/.exec(t.title);
  if (!m) continue;
  const group = m[1];
  crud[group] ??= { pass: 0, fail: 0, skip: 0 };
  if (t.fail) crud[group].fail += 1;
  else if (t.pass) crud[group].pass += 1;
  else crud[group].skip += 1;
}

const totalPass = tests.filter((t) => t.pass).length;
const totalFail = tests.filter((t) => t.fail).length;
const totalSkip = tests.length - totalPass - totalFail;
const genTime = new Date().toISOString();

const rows = Object.entries(crud)
  .map(
    ([g, s]) => `<tr><td>${g}</td><td class="p">${s.pass}</td><td class="${s.fail ? 'f' : 'z'}">${s.fail}</td><td class="z">${s.skip}</td><td>${s.pass + s.skip + s.fail}</td></tr>`,
  )
  .join('\n');

const failures = tests
  .filter((t) => t.fail)
  .map((t) => `<li>${t.title}</li>`)
  .join('\n');

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Phase 1 — rxsoft CRUD status</title>
<style>
 body{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;margin:2rem;color:#e6e6e6;background:#14171c}
 h1{font-size:1.3rem} h2{font-size:1.05rem;margin-top:1.6rem}
 .kpi{display:inline-block;margin:.25rem .75rem .25rem 0;padding:.4rem .8rem;border-radius:8px;background:#1f242c}
 .p{color:#7bd88f}.f{color:#ff7b72}.z{color:#6b7280}
 table{border-collapse:collapse;margin-top:.5rem;min-width:520px}
 td,th{border:1px solid #2a3038;padding:.3rem .7rem;text-align:left}
 th{background:#1b2027}
 ul{margin:.3rem 0}
 small{color:#9aa4b2}
</style></head><body>
<h1>Phase 1 — rxsoft CRUD coverage</h1>
<p>
 <span class="kpi">✔ passed <b class="p">${totalPass}</b></span>
 <span class="kpi">✘ failed <b class="f">${totalFail}</b></span>
 <span class="kpi">− skipped <b class="z">${totalSkip}</b></span>
 <span class="kpi">source <b>${logPath.split('/').pop()}</b></span>
</p>
<h2>Per-resource (crud-suite)</h2>
<table><tr><th>Resource</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Total</th></tr>
${rows}
</table>
<h2>Failures</h2>
${failures ? `<ul class="f">${failures}</ul>` : '<p class="p">None 🎉</p>'}
<p><small>Generated ${genTime} · tracker/make-phase1-report.mjs · Playwright list log parsed</small></p>
</body></html>
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html);
console.log(`make-phase1-report: ${outPath} (${totalPass} passed / ${totalFail} failed / ${totalSkip} skipped)`);
