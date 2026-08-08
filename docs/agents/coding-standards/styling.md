# Styling conventions

How code expresses a design decision. What a surface looks like is `design/`; the values are
`src/styles/*.css`. This is how code is allowed to say it.

**Tailwind utilities in JSX are the styling mechanism.** No CSS modules, no CSS-in-JS, no
component stylesheets. Handwritten CSS lives in `src/styles/` and holds **tokens only**.

`style` is a lint error (`nursery/noInlineStyles`). A value unknown at build time — a computed
offset, a progress width — is the one case that survives it, through a `biome-ignore` whose
reason names the value being computed. Biome rejects a reasonless suppression, so that
explanation is part of the mechanism rather than a courtesy.

**A value outside the tokens does not compile.** `tokens.css` removes Tailwind's own color,
radius, shadow, blur, font and easing scales, so `bg-red-500` and `shadow-lg` fail the build
rather than shipping a value nothing links to the design system. Do not add them back: needing
a value the tokens lack means `design/token-contract.md` is missing a name, and adding one is a
change to that contract.

Font size is the one scale still open — the two Themes name their type scales differently, so
`text-*` stays until #79 settles one set of names.

**Duration is written as a name**: `duration-fast`, `duration-slow`, or no class at all, which
is the contract's own default. `duration-200` is the exception the build cannot catch — a bare
number is not a scale lookup, so there is no scale to drop. Reduced motion is handled once, by
collapsing those durations in `globals.css`, so a component carries no `motion-reduce:` variant.

**Spacing is Tailwind's own scale.** Every gap, pad and margin is a multiple of 4px, which is
what the utilities already produce (`p-6` is 24px). There is no spacing token — why, and what a
value off the scale means, is `design/token-contract.md`. **Breakpoints are Tailwind's own as
well** — mobile-first, `sm:` upward, no registered custom screen.

**A component never asks which Theme is active.** No `data-theme` condition, no `dark:`
variant, no Tailwind variant registered for a Theme. Switching Theme is values changing under
one set of names, so a component reads `--surface-card` and gets the right material. A
component that has to branch means the contract is missing a name — add the name, not the
branch.

Tailwind's `dark` variant is deliberately pointed at a class this app never sets
(`shadcn-adapter.css`), so `dark:` does nothing rather than half-working. The OS never selects
a Theme either: `prefers-color-scheme` chooses nothing here.

**Focus comes from one rule and needs no class.** `globals.css` declares `:focus-visible`
unlayered, which outranks every utility — including a vendored primitive's. A
`focus-visible:ring-*` written in our own code compiles and then loses to it.

**The vendored zone is consumed, never edited.** `src/shared/components/ui/` is CLI output — not
hand-edited to change a token, fix a variant, or match our formatting.

- shadcn's vocabulary is translated **once**, in `src/styles/shadcn-adapter.css`. A primitive
  needing a name that file lacks is a decision about what that name means in both Themes.
- Biome's formatter and import sorting are **off** there, and style rules disagreeing with the
  CLI are disabled for it — that is what keeps `shadcn add <x>` a no-op diff. A newly added
  primitive tripping another rule gets the rule disabled for the zone, not the file fixed.

**`cn` from `@/shared/lib/cn` is the only way class names are combined** — it resolves Tailwind
conflicts, which makes a caller's `className` an override rather than a coin flip. Use `cva`
once a component has more than two or three visual variants; below that inline conditionals are
clearer.

## Where the token files live

`src/app/globals.css` imports, in order: `tokens.css` (contract names → Tailwind utilities),
`standard.css` (values on bare `:root`), `dark-fantasy.css` (values behind
`:root[data-theme=…]`), `shadcn-adapter.css`.

`standard` sits on bare `:root` so a surface the Theme mechanism does not reach — `/admin`,
localized but not themed — still renders in a complete Theme. The dark-fantasy selector carries
`:root` deliberately: a bare attribute selector has the same specificity, which would make the
winner depend on import order.
