# Loader and Rule

The two components that carry the decorative marks: `Loader` is the app's one loading indicator,
`Rule` its one horizontal divider. The drawings and why they differ per Theme are
`design/marks.md`; how a surface arranges them is `docs/features/site-layout.md`.

- **`Loader` (`src/shared/components/Loader/`) is every loading indicator** — a `Suspense`
  fallback, a `loading.tsx`, the wait on a client surface. Lucide's spinner and `ui/spinner.tsx`
  are not reached for. It is `role="status"` named by `common.loading`, so the wait is announced
  once; a surface that already says `aria-busy` marks its `Loader` `aria-hidden`.
- **`Rule` (`src/shared/components/Rule/`) is every horizontal divider** — under a masthead,
  between sections. Decorative: the heading below already says where a section starts.
- **Both are async Server Components** — the Theme is decided on the server (`resolveTheme`), and
  the other Theme's drawing never ships. A client component takes one through a slot
  (`components.md` §The server/client boundary), never by import.
- **Sizes are the floors `design/marks.md` sets** — `Loader` at 32 px, the rule mark at 24 px — and
  a `size-*` on `Loader` replaces the default rather than adding to it.
- **Motion lives inside each SVG**, gated by `prefers-reduced-motion` there; the components carry
  no `animate-*` and no duration class.
