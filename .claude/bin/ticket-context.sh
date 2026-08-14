#!/bin/sh
# The mechanical half of /implement-issue's first two steps: does the ticket carry a spec, and what
# is the branch called. Both are settled by the ticket's own text, so both are `grep`, not judgement.
#
# Usage: ticket-context.sh <issue>

issue="${1:-0}"
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 0

json=$(gh issue view "$issue" --json title,body,labels 2>/dev/null) || {
  echo "TICKET: unreadable — gh could not fetch #$issue"
  exit 0
}
title=$(printf '%s' "$json" | jq -r '.title')
body=$(printf '%s' "$json" | jq -r '.body')
labels=$(printf '%s' "$json" | jq -r '[.labels[].name]|join(" ")')

# --- does the body carry the sections /task-flow's grilling produces ------------------------------
missing=""
for s in problem solution "user stor" implementation testing acceptance; do
  printf '%s' "$body" | grep -qi "$s" || missing="$missing $s"
done
if [ -n "$missing" ]; then
  echo "SPEC: missing —$missing"
  echo "A label with no spec goes back to /task-flow. Stop here and say so."
else
  echo "SPEC: ok — problem, solution, user stories, implementation, testing and acceptance all present"
fi

# --- what the branch is called --------------------------------------------------------------------
type=chore
for t in feat fix docs style refactor perf test build ci; do
  case " $labels " in *" $t "*) type=$t ;; esac
done
slug=$(printf '%s' "$title" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' \
  | cut -d- -f1-4)

echo "BRANCH: $type/$issue-$slug"
echo "Create it with this exact command; the name follows docs/git-branching.md and needs no thought:"
echo "  git checkout -b $type/$issue-$slug dev"
