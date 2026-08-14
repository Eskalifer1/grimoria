#!/bin/sh
# Everything a /verify-branch round needs before its first turn, loaded through the skill's `!`
# blocks so none of it costs a turn.
#
#   review-context.sh <issue> <first|final> head   the diff, the delta since the previous round,
#                                                  whether the gate can be skipped, which axes the
#                                                  changed files earn
#   review-context.sh <issue> <first|final> axes   the full text of exactly those axes
#
# `head` runs at the top of the skill and `axes` at the bottom, so the rules stay next to the short
# facts and the long reference text sits under them. Only `head` writes the round snapshot.

issue="${1:-0}"
round="${2:-first}"
mode="${3:-head}"
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 0
mkdir -p .scratch

names=$(git diff --name-only dev 2>/dev/null)

# --- which axes the changed files earn ------------------------------------------------------------
axes="standards bug-hunt"
skipped=""

if printf '%s\n' "$names" | grep -Eq '^(src/views/|src/features/|src/entities/|src/shared/components/|src/app/\(frontend\)/).*\.tsx$|^messages/'; then
  axes="$axes a11y"
else
  skipped="$skipped a11y(no user-facing .tsx or messages/ catalog)"
fi

added=$(git diff dev -U0 2>/dev/null | grep '^+')
if printf '%s\n' "$names" | grep -Eq '^src/collections/|^src/payload\.config\.ts$|^src/proxy\.ts$|route\.ts$' \
  || printf '%s\n' "$added" | grep -Eq "use server|searchParams|req\.(json|formData|headers|cookies)|formData\(|getPayload"; then
  axes="$axes payload"
else
  skipped="$skipped payload(no collection, config, proxy, route handler, 'use server' or new read of User input)"
fi

# --- the axes themselves --------------------------------------------------------------------------
if [ "$mode" = "axes" ]; then
  emit() {
    [ -f "$2" ] || return 0
    echo
    echo "=== $1 — $2 ==="
    cat "$2"
  }
  emit "what a review may report at all" docs/agents/coding-standards/review-boundaries.md
  for a in $axes; do
    case "$a" in
      standards)
        p=$(ls -d "$HOME"/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/*/skills/engineering/code-review/SKILL.md 2>/dev/null | tail -1)
        [ -n "$p" ] && emit "AXIS standards — ITS STANDARDS AXIS ALONE, skip its Spec axis" "$p"
        ;;
      bug-hunt) emit "AXIS bug hunt" .claude/skills/bug-hunt-review/SKILL.md ;;
      a11y)     emit "AXIS a11y" .claude/skills/a11y-review/SKILL.md ;;
      payload)  emit "AXIS Payload access control" .claude/skills/payload-security-review/SKILL.md ;;
    esac
  done
  exit 0
fi

# --- head -----------------------------------------------------------------------------------------
echo "=== diff against dev ==="
git diff --stat dev 2>/dev/null
echo "--- files ---"
if [ -z "$names" ]; then
  echo "(empty — the range came back with nothing; say so and stop)"
else
  printf '%s\n' "$names"
fi

snap=".scratch/verify-$issue.diff"
echo "--- round delta ---"
if [ "$round" = "first" ] || [ ! -s "$snap" ]; then
  echo "DELTA: n/a — no previous round to compare against"
else
  echo "DELTA: $(git diff dev 2>/dev/null | diff "$snap" - | grep -c '^[<>]') lines differ from the previous round's diff"
fi
git diff dev > "$snap" 2>/dev/null

# --- can the gate be skipped ----------------------------------------------------------------------
[ "$round" = "final" ] && want=full || want=fast
now=$(git diff dev 2>/dev/null | shasum | cut -d' ' -f1)
echo "$now" > ".scratch/gate-$issue.now"
green=$(cat ".scratch/gate-$issue.green" 2>/dev/null)
echo "--- gate ---"
echo "LEVEL: $want"
case "$green" in
  "full $now") echo "GATE: skip — inputs unchanged since the last green full gate" ;;
  "$want $now") echo "GATE: skip — inputs unchanged since the last green $want gate" ;;
  *) echo "GATE: run" ;;
esac

echo "--- axes earned ---"
echo "RUN:$axes"
echo "SKIPPED:${skipped:- none}"
