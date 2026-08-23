#!/bin/sh
# The ticket, plus the mechanical half of /implement-issue's first two steps: does the body carry a
# spec, and what the branch is called. Both are settled by the ticket's own text, so both are
# `grep`, not judgement — and all three come from one `gh` call.
#
# Usage: ticket-context.sh <issue>

# A pasted issue URL reaches here whole. `gh issue view` accepts one, but the branch slug below and
# `gh api .../issues/<n>/...` do not — so the number is taken once, here.
issue=$(printf '%s' "${1:-0}" | sed 's#.*/##')
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 0

json=$(gh issue view "$issue" --json number,title,state,body,labels,comments 2>/dev/null) || {
  echo "TICKET: unreadable — gh could not fetch #$issue"
  exit 0
}
title=$(printf '%s' "$json" | jq -r '.title')
body=$(printf '%s' "$json" | jq -r '.body')
labels=$(printf '%s' "$json" | jq -r '[.labels[].name]|join(" ")')

# A ticket grilled by /task-flow can carry a dozen comments, and the ones that settled the spec are
# either the last few or say so in their own text. The rest is discussion the branch does not need,
# and it is injected whole into every turn of this flow.
printf '%s' "$json" | jq -r '
  ([.comments[] | select(.body | test("spec|acceptance|criterion|criteria|scope"; "i"))]
    + .comments[-3:]) as $keep
  | ($keep | unique_by(.createdAt)) as $keep
  | "#\(.number) \(.title)  [\(.state)]\nlabels: \([.labels[].name]|join(", "))\n\n\(.body)\n\n"
    + ([$keep[] | "--- comment by \(.author.login)\n\(.body[:2000])"] | join("\n"))
    + (if (.comments|length) > ($keep|length)
       then "\n\n(\((.comments|length) - ($keep|length)) earlier comments not shown — they settled nothing the spec repeats. `gh issue view \(.number) --comments` has them.)"
       else "" end)'
echo
echo "=== the two mechanical steps, already settled ==="

# --- does the body carry the sections /task-flow's grilling produces ------------------------------
missing=""
for s in problem solution "user stor" implementation testing acceptance; do
  printf '%s' "$body" | grep -qi "$s" || missing="$missing $s"
done
if [ -n "$missing" ]; then
  echo "SPEC: missing —$missing"
  echo "A label with no spec goes back to /task-flow $issue. Stop here and say so."
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
