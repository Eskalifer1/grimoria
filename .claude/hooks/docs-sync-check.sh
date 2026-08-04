#!/usr/bin/env bash
# Safety net for CLAUDE.md's "Keep docs current" rule: fires before `git commit`
# and flags commits that touch code/process files with zero doc touch.
# Advisory, not permanent — a repeat attempt with the exact same staged content
# passes through, so it never blocks forever once /docs-sync has actually run.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

input_json=$(cat 2>/dev/null || true)
command_text=$(printf '%s' "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null || true)

# A PreToolUse `matcher` only matches the tool name, so this fires on every Bash
# call — the "is this a commit?" filter has to live here. Bail before touching
# the ack dir: acking on an unrelated command would spend this check's one
# warning and let the real commit through silently.
if ! printf '%s' "$command_text" | grep -qE '(^|[;&|(]|&&)[[:space:]]*git[[:space:]]+([^[:space:]|;&]+[[:space:]]+)*commit([[:space:]]|$)'; then
  exit 0
fi

staged=$(git diff --cached --name-only 2>/dev/null || true)

# `-a`/`--all` auto-stages tracked modifications as part of running the commit
# itself, so at PreToolUse time those files aren't in the index yet — union
# them in, otherwise `git commit -a` bypasses this check entirely.
uses_dash_a=false
if printf '%s' "$command_text" | grep -qE -- '(^|[[:space:]])(-a|--all)([[:space:]]|$)'; then
  uses_dash_a=true
  unstaged_tracked=$(git diff --name-only 2>/dev/null || true)
  staged=$(printf '%s\n%s' "$staged" "$unstaged_tracked" | sed '/^$/d' | sort -u)
fi

if [ -z "$staged" ]; then
  exit 0
fi

has_docs=false
has_other=false
other_files=()
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    docs/*|CONTEXT.md|CLAUDE.md|.claude/*) has_docs=true ;;
    *) has_other=true; other_files+=("$f") ;;
  esac
done <<< "$staged"

# Nothing outside docs, or docs already included — nothing to flag.
if ! $has_other || $has_docs; then
  exit 0
fi

# Hash the actual content of the flagged files, not just their paths — so
# re-staging the same files with different content isn't mistaken for an
# already-reviewed change.
content_diff=$(git diff --cached -- "${other_files[@]}" 2>/dev/null || true)
if $uses_dash_a; then
  content_diff="$content_diff"$'\n'"$(git diff -- "${other_files[@]}" 2>/dev/null || true)"
fi

ack_dir=".claude/.docs-sync-acks"
mkdir -p "$ack_dir"
hash=$(printf '%s' "$content_diff" | (command -v sha256sum >/dev/null 2>&1 && sha256sum || shasum -a 256) | cut -d' ' -f1)
ack_file="$ack_dir/$hash"

# Already flagged this exact content once — let it through.
if [ -f "$ack_file" ]; then
  exit 0
fi
touch "$ack_file"

file_list=$(printf -- '- %s\n' "${other_files[@]}")
reason="This commit stages changes with no docs/, CONTEXT.md, or CLAUDE.md update in the same commit:
${file_list}
Run /docs-sync to check whether docs/features/*.md, CONTEXT.md, docs/adr/, or docs/agents/*.md need updating for these before committing. If you already ran it and confirmed nothing needs updating, retry the exact same commit — this staged content will pass through next time."
escaped_reason=$(printf '%s' "$reason" | jq -R -s .)
printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":%s}}' "$escaped_reason"
