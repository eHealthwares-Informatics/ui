#!/usr/bin/env node
/**
 * testid-audit report generator (ui#68, spec e2e/tasks/data_test_id_task.md §4/§5).
 *
 * Scans every .tsx file under src/features (recursively) for JSX openings of
 * interactive Mantine
 * components — TextInput, PasswordInput, NumberInput, Textarea, Switch,
 * Checkbox, Select, Button — whose opening tag carries no `data-testid`, and
 * prints/records a report. Also usable as a one-off checker:
 *
 *   node e2e/tasks/codemods/add-testid.mjs --check   # exit 1 if report ≠ baseline
 *
 * The baseline JSON records only the *count* of offenders. CI runs the vitest
 * gate against it: any NEW offender (count grows) fails the build, while the
 * pre-existing debt is listed here for the standing sweep (never silently
 * forgotten, never a hard block before the lint rule exists).
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(import.meta.dirname, "../../.."); // codemods -> tasks -> e2e -> repo root
const FEATURES_DIR = join(ROOT, "src/features");
const BASELINE_PATH = join(import.meta.dirname, "testid-audit-baseline.json");

const INTERACTIVE = [
  "TextInput",
  "PasswordInput",
  "NumberInput",
  "Textarea",
  "Switch",
  "Checkbox",
  "Select",
  "Button",
];
const SKIP_DIRS = ["__tests__", "node_modules"];

/** Return the byte index of the `>` closing the JSX opening tag that starts at `start` (just before `<Name`), or -1. */
function findTagEnd(source, start) {
  let depth = 0; // { } nesting
  let quote = null; // ' " `
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\" && quote !== "`") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === "'" || ch === '"' || ch === "`") quote = ch;
    else if (ch === ">" && depth === 0) return i;
  }
  return -1;
}

export function auditFeaturesSource(srcDir = FEATURES_DIR) {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (
        entry.isFile() &&
        entry.name.endsWith(".tsx") &&
        !entry.name.includes(".test.")
      ) {
        const source = readFileSync(full, "utf8");
        // Line numbers for the report: newline offsets computed once.
        const lineStarts = [0];
        for (let i = 0; i < source.length; i++)
          if (source[i] === "\n") lineStarts.push(i + 1);
        const lineOf = (idx) => {
          // binary search for the last lineStart <= idx
          let lo = 0,
            hi = lineStarts.length - 1;
          while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lineStarts[mid] <= idx) lo = mid;
            else hi = mid - 1;
          }
          return lo + 1;
        };
        for (const name of INTERACTIVE) {
          const re = new RegExp(`<${name}[\\s/>]`, "g");
          let m;
          while ((m = re.exec(source)) !== null) {
            const tagEnd = findTagEnd(source, m.index);
            if (tagEnd === -1) continue;
            if (!/\bdata-testid\s*=/.test(source.slice(m.index, tagEnd))) {
              offenders.push({
                file: relative(ROOT, full),
                line: lineOf(m.index),
                component: name,
              });
            }
          }
        }
      }
    }
  };
  walk(srcDir);
  return offenders;
}

// Report of previous offender set so re-runs print deltas against the baseline
export function report(offenders) {
  if (offenders.length === 0)
    return "✔ all interactive components carry data-testid";
  const grouped = new Map();
  for (const { file, line, component } of offenders) {
    const key = `${file}:${component}`;
    grouped.set(key, [...(grouped.get(key) ?? []), line]);
  }
  const lines = [...grouped.entries()].map(
    ([k, ls]) => `- ${k} (line${ls.length > 1 ? "s" : ""} ${ls.join(", ")})`,
  );
  return `interactive components missing data-testid (total ${offenders.length}):\n${lines.join("\n")}`;
}

// Direct-CLI mode: `node add-testid.mjs --check [--update-baseline]`
if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].split("/").pop())
) {
  const offenders = auditFeaturesSource();
  const current = { count: offenders.length };
  const readBaseline = () => {
    try {
      return JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
    } catch {
      return null; // first run: baseline not committed yet
    }
  };
  if (process.argv.includes("--update-baseline")) {
    const baseline = readBaseline();
    if (baseline && offenders.length > baseline.count) {
      console.error(
        `baseline would grow (${current.count} > ${baseline.count}) — fix new offenders instead`,
      );
      process.exit(1);
    }
    writeFileSync(BASELINE_PATH, `${JSON.stringify(current, null, 2)}\n`);
    console.log(
      baseline
        ? `baseline updated to ${current.count}`
        : `baseline created at ${current.count}`,
    );
  } else if (process.argv.includes("--check")) {
    const baseline = readBaseline();
    if (!baseline) {
      console.error(
        `missing ${relative(ROOT, BASELINE_PATH)} — commit it via --update-baseline first`,
      );
      process.exit(1);
    }
    if (current.count > baseline.count) {
      console.log(report(offenders));
      process.exit(1);
    }
    console.log(`no erosion (${current.count} <= ${baseline.count})`);
  } else {
    console.log(report(offenders));
  }
}
