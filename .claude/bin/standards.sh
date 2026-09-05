#!/bin/sh
# The coding standards a slice actually needs, in one call.
#
#   standards.sh --list              the profiles and the docs each one holds, paths only
#   standards.sh ui copy             the full text of those profiles' docs, de-duplicated
#
# /implement-issue step 3 routes with `--list` and hands each subagent its profile names; the
# subagent then pays one Bash turn for its whole set instead of one Read turn per doc, and pays for
# no doc outside it. Profiles are a union, so `standards.sh ui copy` prints each shared doc once.
#
# `core` is implied by every other profile — anything under src/ is subject to it.

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" || exit 0
s=docs/agents/coding-standards

# `abstraction.md` is core because every slice makes the call it governs — wrap or repeat, shared
# constant or bare string — and two slices that never read it invent the same helper twice with
# different edge policies, which no gate catches and only a judging round finds.
core="$s/layers.md $s/naming.md $s/imports.md $s/documentation.md $s/typescript.md $s/abstraction.md"

ui="$core $s/components.md $s/styling.md $s/accessibility.md"

profile() {
  case "$1" in
    core)   echo "$core" ;;
    ui)     echo "$ui" ;;
    copy)   echo "$core $s/i18n.md" ;;
    route)  echo "$core $s/routing.md" ;;
    server) echo "$core docs/features/auth.md" ;;
    design) echo "$core design/standard-design.md design/dark-fantasy-design.md design/token-contract.md docs/features/site-layout.md" ;;
    data)   echo "$core docs/features/data-access.md docs/features/data-access/api-local.md" ;;
    form)   echo "$ui $s/i18n.md docs/features/forms.md docs/features/forms/controls.md" ;;
    test)   echo "$core docs/testing.md" ;;
    db)     echo "$core docs/database-migrations.md" ;;
    *)      echo "" ;;
  esac
}

if [ "$1" = "--list" ] || [ -z "$1" ]; then
  echo "Profiles — name them per slice; the slice runs \`.claude/bin/standards.sh <profile...>\`"
  echo "itself and pays one turn for its whole set. Pass several for their union."
  echo
  echo "core    layers, naming, imports, documentation, typescript, abstraction — implied by every profile below"
  for p in ui copy route server design data form test db; do
    extra=""
    for f in $(profile "$p"); do
      case " $core " in *" $f "*) continue ;; esac
      extra="$extra $(basename "$f" .md)"
    done
    printf '%-7s core +%s\n' "$p" "$extra"
  done
  exit 0
fi

want=""
for p in "$@"; do
  set_p=$(profile "$p")
  [ -n "$set_p" ] || { echo "unknown profile: $p — run --list"; exit 2; }
  want="$want $set_p"
done

seen=""
for f in $want; do
  case " $seen " in *" $f "*) continue ;; esac
  seen="$seen $f"
  [ -f "$f" ] || continue
  echo
  echo "=== $f ==="
  cat "$f"
done
