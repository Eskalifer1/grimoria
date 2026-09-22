#!/bin/sh
# The whole deterministic gate, in one call: the fingerprint skip, the four checks, the build, the
# green record, and the first 60 lines of whatever went red.
#
#   gate.sh <tag> [full|fast|e2e]
#
# <tag> names the log files, so two branches can gate at once without reading each other's failure.
# `fast` drops `yarn build` and records a `fast` green, which a later `full` does not accept.
# `e2e` adds the Playwright journeys after the build, and is what /implement-issue's handoff runs —
# last, once, after the adversarial round and the docs pass, so no later edit invalidates it.
#
# The caller runs this and reports what it printed. It re-reads no log — a red run prints the head of
# every failed log itself, because the caller acting on the tool's own words is the point and a
# second turn spent on `Read` buys nothing. Head, not tail: Biome and `tsc` print the diagnostics
# first and a bare count last.

tag="${1:-0}"
[ -n "$tag" ] || tag=0
level="${2:-full}"
case "$level" in fast|e2e) ;; *) level=full ;; esac
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
# The levels nest — `e2e` covers `full` covers `fast` — so a green record satisfies any level at or
# below it and nothing above. A skipped e2e records `full`, which is what keeps a skip from ever
# reading as a journey that ran.
case "$green" in
  "e2e $now")              echo "$level gate: green, inputs unchanged since the last green e2e gate"; exit 0 ;;
  "full $now") [ "$level" = e2e ] || { echo "$level gate: green, inputs unchanged since the last green full gate"; exit 0; } ;;
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

if [ -z "$failed" ] && [ "$level" != fast ]; then
  if yarn build > ".scratch/checks-$tag-build.log" 2>&1; then
    echo "build: PASS"
  else
    echo "build: FAIL"
    failed="$failed build"
  fi
fi

# What the run is recorded as, which is not always what was asked for: an e2e gate with no database
# answering records `full`.
reached="$level"

if [ -z "$failed" ] && [ "$level" = e2e ]; then
  # The port `.env.e2e` names, probed over TCP rather than through `docker` — a Postgres installed
  # any other way serves the run just as well (docs/testing.md → e2e).
  db_port=$(sed -n 's|^DATABASE_URL=.*:\([0-9][0-9]*\)/.*|\1|p' .env.e2e | head -1)
  if [ -n "$db_port" ] && nc -z localhost "$db_port" 2>/dev/null; then
    if yarn test:e2e --reporter=line > ".scratch/checks-$tag-e2e.log" 2>&1; then
      echo "e2e: PASS"
    else
      echo "e2e: FAIL"
      failed="$failed e2e"
    fi
  else
    # Not a failure: the journeys need a database this machine is not offering, and a red gate here
    # would be a red gate about Docker rather than about the branch.
    echo "e2e: SKIP — nothing answering on localhost:${db_port:-?}, start it per docs/testing.md"
    reached=full
  fi
fi

if [ -z "$failed" ]; then
  echo "$reached $now" > ".scratch/gate-$tag.green"
  echo "$level gate: green"
  exit 0
fi

# Red leaves .scratch/gate-$tag.green alone, so the next call re-runs.
for c in $failed; do
  echo
  log=".scratch/checks-$tag-$c.log"
  if [ "$c" = e2e ]; then
    # Playwright puts the build's whole stdout ahead of the failure, so the head of this log is a
    # Next build. The failing expectation and the count are what a caller acts on; the trace, the
    # screenshots and playwright-report/ are on disk for a human.
    echo "=== FAIL: yarn test:e2e — $log, the failure and the count ==="
    awk '/^ *[0-9]+\) /,0' "$log" | head -24
    grep -E '^ *[0-9]+ (failed|passed|flaky)' "$log" | tail -3
  else
    echo "=== FAIL: yarn $c — $log, first 60 lines ==="
    head -60 "$log"
  fi
done
exit 1
