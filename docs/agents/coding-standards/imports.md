# Imports and exports

How a module is reached and what it exposes. Which layer may import which is `layers.md`. Where a
rule is machine-enforced the config is named and is the source of truth.

**Order is machine-enforced and auto-fixable** (`assist.actions.source.organizeImports`). Do not
hand-sort, and do not restate the group list anywhere — changing it is an edit to `biome.json`.

**No two `overrides` in `biome.json` may cover the same path and set the same rule.** Severity merges
across them, but a rule's `options` are replaced by the last one, so the earlier patterns go silently
dead — an import fence that reports nothing and looks enforced. One override owns a path, carrying
that path's full list.

**Alias vs. relative** turns on the module boundary, never the number of `../`. A **module** is
one directory directly under a layer. Inside its own module: relative, so it can be moved without
rewriting its internals. Crossing into another module or layer: `@/`. Inside `shared/`: `@/`,
since it is a collection of independent units rather than a module.

**One primary export per file**, named to match it. **Small companion helpers** are the one
allowance: short, pure, dependency-free helpers may share a thematic file (`date.ts` exporting
`formatDate`, `parseDate`). Once one grows dependencies, tests, or size, it moves out.

**No barrel files.** Not for tree-shaking — Turbopack handles that — but because the barrel pulls
every module it touches into the graph, drags every client component it re-exports across the
`"use client"` boundary, and hard-fails the build when it re-exports a `server-only` module into
a client graph. `optimizePackageImports` covers **third-party** packages only. **No exceptions
currently exist**; one would need every re-export on the same side of the client/server boundary
and would be added by explicit decision. A component's `index.tsx` holding the component is not a
barrel.

**Exports sit at the end**, collected in one `export { … }` statement, so the file's public
surface reads in one place. Partly machine-enforced — `style/useExportsLast` catches a plain
statement after an export, but a lone inline `export function` at the end passes. That half is
review.
