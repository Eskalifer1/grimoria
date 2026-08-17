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

core="$s/layers.md $s/naming.md $s/imports.md $s/documentation.md $s/typescript.md"

profile() {
  case "$1" in
    core)   echo "$core" ;;
    ui)     echo "$core $s/components.md $s/styling.md $s/accessibility.md" ;;
    copy)   echo "$core $s/i18n.md" ;;
    route)  echo "$core $s/routing.md" ;;
    server) echo "$core docs/features/auth.md" ;;
    design) echo "$core design/standard-design.md design/dark-fantasy-design.md design/token-contract.md docs/features/site-layout.md" ;;
    *)      echo "" ;;
  esac
}

if [ "$1" = "--list" ] || [ -z "$1" ]; then
  echo "Profiles — name them per slice; the slice runs \`.claude/bin/standards.sh <profile...>\`"
  echo "itself and pays one turn for its whole set. Pass several for their union."
  echo
  echo "core    layers, naming, imports, documentation, typescript — implied by every profile below"
  for p in ui copy route server design; do
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
