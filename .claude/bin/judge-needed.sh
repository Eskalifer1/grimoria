#!/bin/sh
# Decides whether a branch earns a /verify-branch round at all, from what it touched.
#
# A judging round costs a fork's whole entry price before it looks at anything, so a branch that
# cannot break the rules an axis holds is judged for nothing. Files that only tests and the gate can
# be wrong about — a pure helper, a constant, a doc — carry no axis and skip the round.
#
# Usage: judge-needed.sh   (from anywhere in the worktree)

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 0

# The base is where this branch left `dev`, not `dev`'s tip: a plain `git diff dev` counts every
# commit `dev` gained since as a reversed change belonging to this branch, and the inflated file and
# line counts below then flip a skip into a round nobody needed.
base=$(git merge-base dev HEAD 2>/dev/null || echo dev)

names=$(git diff --name-only "$base" 2>/dev/null)
[ -z "$names" ] && { echo "JUDGE: run — the diff came back empty, which is a broken range, not a clean branch"; exit 0; }

files=$(printf '%s\n' "$names" | grep -c .)
# `awk`, not `paste | bc`: `bc` is not on every machine, and the `: "${lines:=0}"` fallback below
# turned its absence into a zero line count — which silently flips a branch that earned a round into
# a skip. `awk` is POSIX and sums in one process.
lines=$(git diff --shortstat "$base" 2>/dev/null | grep -oE '[0-9]+ (insertion|deletion)' | awk '{s+=$1} END {print s+0}')
: "${lines:=0}"

# Anything outside this set is code an axis can have something to say about.
risky=$(printf '%s\n' "$names" | grep -Ev '^(src/shared/lib/|src/constants/|tests/|docs/|design/|\.claude/|\.cspell/|[^/]+\.md$|[^/]+\.json$|[^/]+\.jsonc$)')

if [ -n "$risky" ]; then
  echo "JUDGE: run — the diff reaches code the gate and the tests cannot judge alone:"
  printf '  %s\n' $risky
elif [ "$files" -gt 5 ] || [ "$lines" -gt 150 ]; then
  echo "JUDGE: run — $files files and $lines changed lines is past the size a single author reliably self-checks"
else
  echo "JUDGE: skip — $files files, $lines changed lines, all of them helpers, constants, tests, docs or config"
  echo "Report the step as skipped with this reason, run the full gate yourself, and give the"
  echo "acceptance verdicts from the diff. No fork, no axes."
fi
