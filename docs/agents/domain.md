# Domain docs

How the engineering skills consume this repo's domain documentation when exploring the
codebase. This is a single-context repo: one `CONTEXT.md` at the root, ADRs in `docs/adr/`.

## Before exploring, read these

- **`CONTEXT.md`** — the glossary.
- **`docs/adr/`** — the ADRs touching the area you are about to work in.

If a file does not exist, **proceed silently**. Do not flag its absence or suggest creating it
upfront; `/domain-modeling` creates them lazily, when terms or decisions actually get resolved.

## Use the glossary's vocabulary

When your output names a domain concept — an issue title, a refactor proposal, a hypothesis, a
test name — use the term as `CONTEXT.md` defines it, and not a synonym it explicitly avoids.

A concept missing from the glossary is a signal: either you are inventing language the project
does not use (reconsider), or there is a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

Where your output contradicts an existing ADR, surface it rather than silently overriding:

> _Contradicts ADR-0007 (Postgres on Neon) — but worth reopening because…_
