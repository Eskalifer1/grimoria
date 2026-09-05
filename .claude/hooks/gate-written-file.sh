#!/bin/sh
# PostToolUse hook for Edit|Write: format the file Biome owns, spell-check it, run its test, and on
# a Write that creates a doc, hand back the writing rule the file was drafted without.
#
# Exit 0 — nothing to say. Exit 2 — stderr goes back to the model as feedback, which is the only
# code that reaches it. Any other code is a hook error the model never sees, so failures here are
# swallowed deliberately: a broken hook must not stop a session.

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
[ -x "$root/node_modules/.bin/biome" ] || exit 0

payload=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_name||"")+"\n"+(j.tool_input?.file_path||""))}catch{}})' 2>/dev/null) || exit 0
tool=$(printf '%s' "$payload" | head -1)
file=$(printf '%s' "$payload" | tail -1)
[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

case "$file" in
  "$root"/*) ;;
  *) exit 0 ;;
esac
case "$file" in
  *"/node_modules/"*|*"/.scratch/"*|*"/.next/"*|*"/src/payload-types.ts") exit 0 ;;
esac

# Make a new file visible to `git diff dev` — the range every gate and judging round reads.
if ! git -C "$root" ls-files --error-unmatch -- "$file" >/dev/null 2>&1; then
  git -C "$root" check-ignore -q -- "$file" || git -C "$root" add -N -- "$file" >/dev/null 2>&1
fi

out=""
status=0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.css|*.json|*.jsonc)
    # --no-errors-on-unmatched: a path biome.json ignores processes zero files and would otherwise
    # exit non-zero, reporting a clean file as broken.
    if ! biome_out=$("$root/node_modules/.bin/biome" check --write --no-errors-on-unmatched "$file" 2>&1); then
      out="$biome_out"
      status=1
    fi
    ;;
esac

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.css|*.json|*.jsonc|*.md)
    if [ -x "$root/node_modules/.bin/cspell" ]; then
      # --no-must-find-files: a path cspell.config.jsonc ignores checks zero files and would
      # otherwise exit 1, reporting a clean file as broken.
      if ! spell_out=$("$root/node_modules/.bin/cspell" lint --no-progress --show-suggestions --no-must-find-files "$file" 2>&1); then
        out="$out
$spell_out"
        status=1
      fi
    fi
    ;;
esac

# Run the one test that covers the file just written, and only then. Writing an implementation file
# is the exact moment its test is expected to pass, so a red result here is news the author has to
# act on. Writing a test file is not that moment — red is what TDD asks for first — and nothing
# outside src/ has a test to run, so both fall through untouched.
case "$file" in
  "$root"/src/*.ts|"$root"/src/*.tsx)
    rel=${file#"$root"/src/}
    # `naming.md` names a test after its subject, not after `index`, so a component at
    # `Foo/index.tsx` is covered by `tests/<path>/Foo.test.tsx`. Mirroring the path alone finds
    # `tests/<path>/Foo/index.test.tsx`, which this repo has none of — every component write then
    # looked green because nothing ran. The folder name is the second candidate for that reason.
    subject=${rel%.*}
    case "${rel##*/}" in index.*) subject=${rel%/*} ;; esac
    for t in "$root/tests/$subject.test.ts" "$root/tests/$subject.test.tsx"; do
      [ -f "$t" ] || continue
      if ! test_out=$(cd "$root" && yarn vitest run "${t#"$root"/}" --reporter dot 2>&1); then
        out="$out
$(printf '%s\n' "$test_out" | tail -40)"
        status=1
      fi
      break
    done
    ;;
esac

# The rules injection fires on Edit, not on the Write that creates a file, so a new doc under the
# `paths:` globs of .claude/rules/writing-docs.md is drafted before the rule governing it ever
# loads. Hand the rule back here, on Write alone — on Edit the injection already did it.
if [ "$tool" = "Write" ]; then
  case "${file#"$root"/}" in
    docs/*.md|design/*.md|CLAUDE.md|CONTEXT.md|README.md|.claude/rules/*.md|.claude/skills/*.md)
      docnote=1
      ;;
  esac
fi

if [ "${docnote:-0}" -eq 1 ]; then
  printf '%s\n' "$file was written before .claude/rules/writing-docs.md loaded — that rule injects on Edit, not on the Write that created the file. Read it now, revise this doc against it, then run its deletion pass as its own pass and name what was cut." >&2
  [ "$status" -eq 0 ] && exit 2
fi

[ "$status" -eq 0 ] && exit 0

printf '%s\n' "$file was written, then auto-formatted. What is left needs you:" >&2
printf '%s\n' "$out" >&2
printf '%s\n' "Fix it now — the gate will report the same thing later, at the cost of a full round trip. An unknown word that is correct goes into .cspell/grimoria.txt; a red test needs the code, not another run." >&2
exit 2
