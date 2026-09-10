# Reports a comment run longer than three lines: a run of `//` lines, or a `/* */`
# block that is not JSDoc. Prints "line:count" per run. `documentation.md` holds the
# rule — a comment grown into a paragraph is a decision, and decisions live in docs.
BEGIN { run = 0; start = 0; block = 0 }

function flush() {
  if (run > 3) { printf "%d:%d\n", start, run }
  run = 0
}

{
  line = $0
  sub(/^[ \t]+/, "", line)

  if (block) {
    run++
    if (line ~ /\*\//) { flush(); block = 0 }
    next
  }

  if (line ~ /^\/\//) {
    if (run == 0) { start = NR }
    run++
    next
  }

  if (line ~ /^\/\*/ && line !~ /^\/\*\*/ && line !~ /\*\//) {
    flush()
    start = NR
    run = 1
    block = 1
    next
  }

  flush()
}

END { flush() }
