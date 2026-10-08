#!/bin/sh
# format-changed.sh — run the repo-pinned oxfmt --check on files changed vs origin/master.
#
# Mirrors what the .githooks/pre-push hook checks, so devs/agents can run the
# same gate manually before pushing:
#
#   npm run format:changed        # check only
#   npm run format:changed -- --write   # not supported by design; use:
#   npm run format:write          # fix everything
#
# Only *.ts / *.tsx / *.css files changed relative to origin/master are checked.
# Uses node_modules/.bin/oxfmt (repo-pinned) — never `npx oxfmt`, which pulls a
# different version that formats differently than CI.

set -u

repo_root=$(git rev-parse --show-toplevel) || exit 1
cd "$repo_root" || exit 1

base="refs/remotes/origin/master"
if ! git rev-parse --verify -q "$base" >/dev/null; then
  echo "format-changed: origin/master not found (run 'git fetch origin master') first." >&2
  exit 1
fi

oxfmt="$repo_root/node_modules/.bin/oxfmt"
if [ ! -x "$oxfmt" ]; then
  echo "format-changed: repo-pinned oxfmt not found at $oxfmt — run 'npm install' first." >&2
  exit 1
fi

files=""
for f in $(git diff --name-only "$base"...HEAD -- '*.ts' '*.tsx' '*.css' | sort -u); do
  [ -f "$f" ] && files="$files $f"
done

if [ -z "${files# }" ]; then
  echo "format-changed: no changed .ts/.tsx/.css files vs origin/master — nothing to check."
  exit 0
fi

echo "format-changed: checking $(echo $files | wc -w | tr -d ' ') file(s) with oxfmt $("$oxfmt" --version 2>/dev/null) ..."

# shellcheck disable=SC2086
if "$oxfmt" --check $files; then
  echo "format-changed: all changed files are formatted."
  exit 0
else
  echo ""
  echo "format-changed: UNFORMATTED files listed above."
  echo "format-changed: Fix with 'npm run format:write', then re-run 'npm run format:changed'."
  exit 1
fi
