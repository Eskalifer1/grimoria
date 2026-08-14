#!/bin/sh
# Prints everything a /verify-branch round needs before its first turn: the diff, how far the branch
# moved since the previous round, which review axes the changed files earn, and the full text of
# exactly those axes. Loaded through the skill's `!` block, so all of it costs zero turns.
#
# Usage: review-context.sh <issue> <first|final>

issue="${1:-0}"
round="${2:-first}"
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 0
mkdir -p .scratch

names=$(git diff --name-only dev 2>/dev/null)

echo "=== diff against dev ==="
git diff --stat dev 2>/dev/null
echo "--- files ---"
if [ -z "$names" ]; then
  echo "(empty — the range came back with nothing; say so and stop)"
else
  printf '%s\n' "$names"
fi

# --- how far the branch moved since the previous round -------------------------------------------
snap=".scratch/verify-$issue.diff"
echo "--- round delta ---"
if [ "$round" = "first" ]; then
  git diff dev > "$snap" 2>/dev/null
  echo "first round — no previous snapshot"
elif [ -s "$snap" ]; then
  delta=$(git diff dev 2>/dev/null | diff "$snap" - | grep -c '^[<>]')
  echo "DELTA: $delta lines differ from the first round's diff"
  git diff dev > "$snap" 2>/dev/null
else
  echo "DELTA: unknown — no first-round snapshot on disk"
  git diff dev > "$snap" 2>/dev/null
fi

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

echo "--- axes earned ---"
echo "RUN:$axes"
echo "SKIPPED:${skipped:- none}"
echo "A skipped axis is skipped because the diff cannot break its rules. Report it as skipped with"
echo "this reason, and do not run it."

# --- the axes themselves --------------------------------------------------------------------------
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
