#!/bin/sh
# One measured /implement-issue run, for the cost work under #66. It starts a nested `claude` with
# permissions off, so it refuses to run anywhere but the throwaway worktree the measurements use.
#
#   e2e-run.sh <issue> <run-label> [skill-and-args] [model]
#
# The third argument is the slash command without its leading slash, defaulting to
# "implement-issue <issue>" — pass "verify-branch 75 full" to measure a judging round on its own.
#
# The sandbox is the newest scratchpad holding an `e2e2/` worktree and a `shim/` on PATH — the shim
# serves the ticket from a fixture and swallows every write back to GitHub. Output lands in
# <label>.jsonl next to <label>.start and <label>.end, which is what the transcript analysis reads.

issue="$1"
label="$2"
cmd="${3:-implement-issue $issue}"
model="${4:-opus}"
if [ -z "$issue" ] || [ -z "$label" ]; then
  echo "usage: e2e-run.sh <issue> <run-label> [skill-and-args] [model]"
  exit 2
fi
case "$issue$label$model" in
  *[!0-9a-zA-Z_-]*) echo "issue, label and model carry only letters, digits, - and _"; exit 2 ;;
esac
case "$cmd" in
  *[!0-9a-zA-Z_\ -]*) echo "the skill and its arguments carry only letters, digits, spaces, - and _"; exit 2 ;;
esac

# The scratchpad root is the repo path with every slash turned into a dash, under the running user.
slug=$(git rev-parse --show-toplevel 2>/dev/null | sed 's#/#-#g')
sb=""
for d in "/private/tmp/claude-$(id -u)/$slug"/*/scratchpad; do
  [ -d "$d/e2e2" ] && [ -x "$d/shim/gh" ] || continue
  [ -z "$sb" ] || [ "$d" -nt "$sb" ] && sb="$d"
done
[ -n "$sb" ] || { echo "no sandbox found — expected a scratchpad holding e2e2/ and shim/gh"; exit 2; }

# A real checkout has a remote and a branch; the sandbox worktree is detached and disposable.
[ -f "$sb/e2e2/.env" ] || { echo "$sb/e2e2 has no .env — not a prepared sandbox"; exit 2; }

cd "$sb/e2e2" || exit 2
PATH="$sb/shim:$PATH"
export PATH

date +%s > "$sb/$label.start"
claude -p "/$cmd" \
  --output-format stream-json --verbose \
  --dangerously-skip-permissions --model "$model" \
  < /dev/null > "$sb/$label.jsonl" 2> "$sb/$label.err"
status=$?
date +%s > "$sb/$label.end"

echo "sandbox: $sb"
echo "exit=$status  elapsed=$(($(cat "$sb/$label.end") - $(cat "$sb/$label.start")))s"
echo "transcript: $sb/$label.jsonl"
