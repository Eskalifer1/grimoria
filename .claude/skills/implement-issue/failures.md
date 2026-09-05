# When `/implement-issue` goes wrong

Each case names the one response; none of them is "work around it".

- **A gate will not go green after three attempts** — stop and report, with the verbatim failure and
  what was tried. Do not disable a check, skip a test, or widen a type to get past it.
- **The branch already exists** — check it out and continue from wherever its state puts the flow;
  do not branch again or reset it.
- **The issue is closed, or lost `ready-for-agent`, mid-flow** — stop and ask.
- **A review axis returns nothing** — a gate that found no file of its kind and a subagent that
  died look identical. Re-run that one axis alone; an empty result twice is an empty result.
- **An upstream skill body cannot be read** — the glob in `task-flow/spec.md` matched nothing.
  Stop and ask the user to invoke the command by hand; do not improvise the skill's content.
- **The user abandons mid-flow** — the branch and `.scratch/<issue>/` are the state. A later
  session resumes by reading both, not by starting over.

