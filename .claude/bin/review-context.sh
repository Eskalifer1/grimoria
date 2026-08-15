#!/bin/sh
# Everything a /verify-branch round needs before its first turn, loaded through the skill's `!`
# blocks so none of it costs a turn.
#
#   review-context.sh <issue> <full|recheck> head   the diff, the delta since the previous round,
#                                                   whether the gate can be skipped, which axes the
#                                                   changed files earn
#   review-context.sh <issue> <full|recheck> axes   the full text of exactly those axes
#
# `head` runs at the top of the skill and `axes` at the bottom, so the rules stay next to the short
# facts and the long reference text sits under them. Only `head` writes the round snapshot, and it
# leaves the delta on disk for `axes` to read after the snapshot has moved on.

issue="${1:-0}"
round="${2:-full}"
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
  # A recheck under the delta floor runs no axis, so printing their text would load a reference
  # nobody opens.
  delta=$(cat ".scratch/verify-$issue.delta" 2>/dev/null)
  if [ "$round" = "recheck" ] && [ -n "$delta" ] && [ "$delta" -lt 20 ] 2>/dev/null; then
    echo "(no axis runs on a recheck of $delta lines — nothing to load)"
    exit 0
  fi
  out=".scratch/axes-$issue.md"
  : > "$out"
  emit() {
    [ -f "$2" ] || return 0
    { echo; echo "=== $1 — $2 ==="; cat "$2"; } >> "$out"
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
  # A block over 30,000 characters is not injected — it is written to a side file the reader then has
  # to hunt down, which costs the turns this whole script exists to avoid. Under the ceiling the text
  # goes inline for free; over it, one named file and one Read beats a truncated block.
  if [ "$(wc -c < "$out")" -gt 28000 ]; then
    echo "The axes are too long to sit inline. **Read \`$out\` once, in full, before section 5** —"
    echo "it holds review-boundaries.md and the text of exactly these axes:$axes"
  else
    cat "$out"
  fi
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
if [ "$round" != "recheck" ] || [ ! -s "$snap" ]; then
  echo "DELTA: n/a — no previous round to compare against"
  echo "" > ".scratch/verify-$issue.delta"
else
  delta=$(git diff dev 2>/dev/null | diff "$snap" - | grep -c '^[<>]')
  echo "DELTA: $delta lines differ from the previous round's diff"
  echo "$delta" > ".scratch/verify-$issue.delta"
fi
git diff dev > "$snap" 2>/dev/null

# --- can the gate be skipped ----------------------------------------------------------------------
want=full
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
