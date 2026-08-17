#!/bin/sh
# Everything a /verify-branch round needs before its first turn, loaded through the skill's `!`
# blocks so none of it costs a turn.
#
#   review-context.sh <issue> <full|recheck> head   the diff, the delta since the previous round,
#                                                   whether the gate can be skipped, which axes the
#                                                   changed files earn, and whether they split
#   review-context.sh <issue> <full|recheck> axes   the full text of exactly those axes, or their
#                                                   paths alone when subagents will read them
#
# `head` runs at the top of the skill and `axes` at the bottom, so the rules stay next to the short
# facts and the long reference text sits under them. `head` reads the working tree once and leaves
# everything `axes` needs on disk — the axis list, the delta and the split decision — so the second
# call re-derives nothing.

issue="${1:-0}"
round="${2:-full}"
mode="${3:-head}"
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 0
mkdir -p .scratch

snap=".scratch/verify-$issue.diff"

# --- the axes themselves --------------------------------------------------------------------------
if [ "$mode" = "axes" ]; then
  axes=$(cat ".scratch/verify-$issue.axes" 2>/dev/null)
  delta=$(cat ".scratch/verify-$issue.delta" 2>/dev/null)
  split=$(cat ".scratch/verify-$issue.split" 2>/dev/null)

  # A recheck under the delta floor runs no axis, so printing their text would load a reference
  # nobody opens.
  if [ "$round" = "recheck" ] && [ -n "$delta" ] && [ "$delta" -lt 20 ] 2>/dev/null; then
    echo "(no axis runs on a recheck of $delta lines — nothing to load)"
    exit 0
  fi

  path_for() {
    case "$1" in
      standards) ls -d "$HOME"/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/*/skills/engineering/code-review/SKILL.md 2>/dev/null | tail -1 ;;
      bug-hunt)  echo .claude/skills/bug-hunt-review/SKILL.md ;;
      a11y)      echo .claude/skills/a11y-review/SKILL.md ;;
      payload)   echo .claude/skills/payload-security-review/SKILL.md ;;
    esac
  }

  # Above the split threshold every axis is carried by its own subagent, and each one re-reads its
  # own axis file. Printing the text here would load four rule sets into the context that judges
  # none of them.
  if [ "$split" = "yes" ]; then
    echo "One \`review-axis\` subagent per axis carries these, and each re-reads its own file."
    echo "**Read none of them here.** Hand each subagent its path and the range:"
    echo
    echo "  review-boundaries (every subagent reads this too) -> docs/agents/coding-standards/review-boundaries.md"
    for a in $axes; do
      p=$(path_for "$a")
      [ -n "$p" ] && echo "  $a -> $p"
    done
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
    p=$(path_for "$a")
    case "$a" in
      standards) [ -n "$p" ] && emit "AXIS standards — ITS STANDARDS AXIS ALONE, skip its Spec axis" "$p" ;;
      bug-hunt)  emit "AXIS bug hunt" "$p" ;;
      a11y)      emit "AXIS a11y" "$p" ;;
      payload)   emit "AXIS Payload access control" "$p" ;;
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

# --- head: read the working tree once -------------------------------------------------------------
# The diff is the single most expensive call in this script and four sections want it. It runs here,
# into a temp file, and every section below reads that file.
#
# The base is where this branch left `dev`, not `dev`'s tip. A plain `git diff dev` hands the judge
# every commit `dev` gained since the branch started, reversed, as though this branch had deleted it —
# which is how a judging round reports findings against code the branch never touched.
base=$(git merge-base dev HEAD 2>/dev/null || echo dev)

new=".scratch/verify-$issue.new"
git diff "$base" > "$new" 2>/dev/null
names=$(git diff --name-only "$base" 2>/dev/null)
files=$(printf '%s\n' "$names" | grep -c .)
lines=$(( $(grep -cE '^[+-]' "$new") - $(grep -cE '^(\+\+\+|---)' "$new") ))

echo "=== diff against where this branch left dev ==="
git diff --stat "$base" 2>/dev/null
echo "--- files ---"
if [ -z "$names" ]; then
  echo "(empty — the range came back with nothing; say so and stop)"
else
  printf '%s\n' "$names"
fi

# --- which axes the changed files earn ------------------------------------------------------------
axes="standards bug-hunt"
skipped=""

if printf '%s\n' "$names" | grep -Eq '^(src/views/|src/features/|src/entities/|src/shared/components/|src/app/\(frontend\)/).*\.tsx$|^messages/'; then
  axes="$axes a11y"
else
  skipped="$skipped a11y(no user-facing .tsx or messages/ catalog)"
fi

if printf '%s\n' "$names" | grep -Eq '^src/collections/|^src/payload\.config\.ts$|^src/proxy\.ts$|route\.ts$' \
  || grep -Eq "^\+.*(use server|searchParams|req\.(json|formData|headers|cookies)|formData\(|getPayload)" "$new"; then
  axes="$axes payload"
else
  skipped="$skipped payload(no collection, config, proxy, route handler, 'use server' or new read of User input)"
fi
printf '%s' "$axes" > ".scratch/verify-$issue.axes"

# --- round delta ----------------------------------------------------------------------------------
echo "--- round delta ---"
if [ "$round" != "recheck" ] || [ ! -s "$snap" ]; then
  echo "DELTA: n/a — no previous round to compare against"
  echo "" > ".scratch/verify-$issue.delta"
else
  delta=$(diff "$snap" "$new" | grep -c '^[<>]')
  echo "DELTA: $delta lines differ from the previous round's diff"
  echo "$delta" > ".scratch/verify-$issue.delta"
fi
mv "$new" "$snap"

# --- can the gate be skipped ----------------------------------------------------------------------
want=full
now=$(shasum < "$snap" | cut -d' ' -f1)
echo "$now" > ".scratch/gate-$issue.now"
green=$(cat ".scratch/gate-$issue.green" 2>/dev/null)
echo "--- gate ---"
echo "LEVEL: $want"
case "$green" in
  "full $now") echo "GATE: skip — inputs unchanged since the last green full gate" ;;
  "$want $now") echo "GATE: skip — inputs unchanged since the last green $want gate" ;;
  *) echo "GATE: run" ;;
esac

# --- axes earned, and whether they split ----------------------------------------------------------
# One pass holding four rule sets at once starts dropping findings past this size, so the split is
# decided here rather than counted again by the reader.
if [ "$files" -gt 5 ] || [ "$lines" -gt 150 ]; then split=yes; else split=no; fi
printf '%s' "$split" > ".scratch/verify-$issue.split"

echo "--- axes earned ---"
echo "RUN:$axes"
echo "SKIPPED:${skipped:- none}"
if [ "$split" = yes ]; then
  echo "SPLIT: yes — $files files, $lines changed lines. One review-axis subagent per axis, all"
  echo "       launched in one message. The appendix prints their paths, not their text."
else
  echo "SPLIT: no — $files files, $lines changed lines. Carry the axes yourself, in sequence, from"
  echo "       the appendix at the bottom of this file."
fi
