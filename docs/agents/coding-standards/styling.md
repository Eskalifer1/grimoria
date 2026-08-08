# Styling conventions

How code expresses a design decision. What a surface looks like is `design/`; the values are
`src/styles/*.css`. This is how code is allowed to say it.

**Tailwind utilities in JSX are the styling mechanism.** No CSS modules, no CSS-in-JS, no
component stylesheets. A `style` prop is for a value that cannot be known at build time — a
computed offset, a progress width — never for a colour, spacing step, or font. Handwritten CSS
lives in `src/styles/` and holds **tokens only**.

**A value outside the tokens does not compile.** `tokens.css` removes Tailwind's own colour,
radius, shadow, blur, font and easing scales, so `bg-red-500` and `shadow-lg` fail the build
rather than shipping a value nothing links to the design system. Do not add them back: needing
a value the tokens lack means `design/token-contract.md` is missing a name, and a name is added
to **both** Themes in the same change or not at all.

Font size is the one scale still open — the two Themes name their type scales differently, so
`text-*` stays until #79 settles one set of names.

**Spacing is Tailwind's own scale.** Every gap, pad and margin is a multiple of 4px, which is
what the utilities already produce (`p-6` is 24px). There is no spacing token and none is to be
added. Anything not a multiple of four is a hairline, a font metric, or a bug.

**A component never asks which Theme is active.** No `data-theme` condition, no `dark:`
variant, no Tailwind variant registered for a Theme. Switching Theme is values changing under
one set of names, so a component reads `--surface-card` and gets the right material. A
component that has to branch means the contract is missing a name — add the name, not the
branch.

Tailwind's `dark` variant is deliberately pointed at a class this app never sets
(`shadcn-adapter.css`), so `dark:` does nothing rather than half-working. The OS never selects
a Theme either: `prefers-color-scheme` chooses nothing here.

**The vendored zone is consumed, never edited.** `src/shared/components/ui/` is CLI output — not
hand-edited to change a token, fix a variant, or match our formatting.

- shadcn's vocabulary is translated **once**, in `src/styles/shadcn-adapter.css`. A primitive
  needing a name that file lacks is a decision about what that name means in both Themes.
- Anything we write, wrappers included, lives outside `ui/` under the ordinary rules.
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
