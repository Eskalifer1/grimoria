#!/bin/sh
# The whole deterministic gate, in one call: the fingerprint skip, the four checks, the build, the
# green record, and the first 60 lines of whatever went red.
#
#   gate.sh <tag> [full|fast]
#
# <tag> names the log files, so two branches can gate at once without reading each other's failure.
# `fast` drops `yarn build` and records a `fast` green, which a later `full` does not accept.
#
# The caller runs this and reports what it printed. It re-reads no log — a red run prints the head of
# every failed log itself, because the caller acting on the tool's own words is the point and a
# second turn spent on `Read` buys nothing. Head, not tail: Biome and `tsc` print the diagnostics
# first and a bare count last.

tag="${1:-0}"
[ -n "$tag" ] || tag=0
level="${2:-full}"
[ "$level" = fast ] || level=full
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 0
mkdir -p .scratch

# The fingerprint is the diff from where this branch left `dev`, so any edit anywhere in the branch
# moves it. A file never `git add -N`'d is invisible to it, and this skip would then pass over code it
# cannot see.
#
# The base is `merge-base`, not `dev` itself: a plain `git diff dev` reads every commit `dev` gained
# since the branch started as a reversed change belonging to the branch, and a teammate's merge would
# then move the fingerprint and re-run a gate that was green. The three-dot form is not the fix — it
# resolves to HEAD and drops the working tree, which is where this flow keeps all of its code.
base=$(git merge-base dev HEAD 2>/dev/null || echo dev)
now=$(git diff "$base" 2>/dev/null | shasum | cut -d' ' -f1)
echo "$now" > ".scratch/gate-$tag.now"
green=$(cat ".scratch/gate-$tag.green" 2>/dev/null)
case "$green" in
  "full $now")             echo "$level gate: green, inputs unchanged since the last green full gate"; exit 0 ;;
  "fast $now") [ "$level" = fast ] && { echo "fast gate: green, inputs unchanged since the last green fast gate"; exit 0; } ;;
esac

# Every gate runs even after one goes red — one report carrying four failures beats four round trips.
# The `package.json` scripts, never the binaries under them: `yarn typecheck` runs `next typegen`
# first, and Payload's generated types are stale without it.
failed=""
for c in check typecheck spellcheck test; do
  if yarn "$c" > ".scratch/checks-$tag-$c.log" 2>&1; then
    echo "$c: PASS"
  else
    echo "$c: FAIL"
    failed="$failed $c"
  fi
done

if [ -z "$failed" ] && [ "$level" = full ]; then
  if yarn build > ".scratch/checks-$tag-build.log" 2>&1; then
    echo "build: PASS"
  else
    echo "build: FAIL"
    failed="$failed build"
  fi
fi

if [ -z "$failed" ]; then
  echo "$level $now" > ".scratch/gate-$tag.green"
  echo "$level gate: green"
  exit 0
fi

# Red leaves .scratch/gate-$tag.green alone, so the next call re-runs.
for c in $failed; do
  echo
  echo "=== FAIL: yarn $c — .scratch/checks-$tag-$c.log, first 60 lines ==="
  head -60 ".scratch/checks-$tag-$c.log"
done
exit 1
