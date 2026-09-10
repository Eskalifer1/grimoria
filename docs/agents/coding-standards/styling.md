# Styling conventions

How code expresses a design decision. What a surface looks like is `design/`; the values are
`src/styles/*.css`. This is how code is allowed to say it.

**Tailwind utilities in JSX are the styling mechanism.** Handwritten CSS lives in `src/styles/` and
holds **tokens only**.

`style` is a lint error (`nursery/noInlineStyles`). A value unknown at build time — a computed
offset, a progress width — is the one case that survives it, through a `biome-ignore` whose
reason names the value being computed; Biome rejects a reasonless suppression.

**A value outside the tokens does not compile.** `tokens.css` removes Tailwind's own color,
radius, shadow, blur, font, easing and tracking scales, so `bg-red-500` and `shadow-lg` fail the
build rather than shipping a value nothing links to the design system. Do not add them back: needing
a value the tokens lack means `design/token-contract.md` is missing a name, and adding one is a
change to that contract.

**Font size and line height are Tailwind's own scale**, like spacing — `text-*` is the type scale
and there is no token to reach for. **Tracking is a token**: the first three `--ls-*` ride on the
`text-*` step, so `text-3xl` already carries the tracking measured for it, and the two that follow
a font role rather than a size are `tracking-meta` and `tracking-mono`. Tailwind's own tracking
scale is dropped, so `tracking-wide` fails the build; `tracking-tight` survives only as the alias
`shadcn-adapter.css` restores for `ui/`. `design/token-contract.md` holds the argument.

**Duration is written as a name**: `duration-fast`, `duration-slow`, or no class at all, which
is the contract's own default. `duration-200` is the exception the build cannot catch — a bare
number is not a scale lookup, so there is no scale to drop. **The curve works the same way** —
`ease-standard`, `ease-emphasized`, or nothing, which is `--ease-standard`. Reduced motion is
handled once, by collapsing those durations in `globals.css`, so a component carries no
`motion-reduce:` variant.

**`animate-in`, `fade-in-0` and the rest come from `tw-animate-css`**, not Tailwind, and read
neither default above — `globals.css` sets what they do read, so a registry primitive animates on
the Theme's timing without a class. `design/token-contract.md` holds the argument.

**Spacing is Tailwind's own scale.** Every gap, pad and margin is a multiple of 4px, which is
what the utilities already produce (`p-6` is 24px). There is no spacing token — why, and what a
value off the scale means, is `design/token-contract.md`. **Breakpoints are Tailwind's own as
well** — mobile-first, `sm:` upward.

**A component never asks which Theme is active.** No `data-theme` condition, no `dark:`
variant, no Tailwind variant registered for a Theme. Switching Theme is values changing under
one set of names, so a component reads `--surface-card` and gets the right material. A
component that has to branch means the contract is missing a name — add the name, not the
branch.

Tailwind's `dark` variant is deliberately pointed at a class this app never sets
(`shadcn-adapter.css`), so `dark:` does nothing rather than half-working. The OS never selects
a Theme either: `prefers-color-scheme` chooses nothing here.

**Focus comes from one rule and needs no class.** `globals.css` declares `:focus-visible`
unlayered, which outranks every utility — including a registry primitive's. A
`focus-visible:ring-*` written in our own code compiles and then loses to it.

**`src/shared/components/ui/` is editable, and a token fix belongs in the file** — `layers.md`
holds the rule and when to wrap instead.

- shadcn's vocabulary is translated **once**, in `src/styles/shadcn-adapter.css`. A primitive
  needing a name that file lacks is a decision about what that name means in both Themes.
- Biome's formatter and import sorting are **off** there, and style rules disagreeing with the
  CLI are disabled for it — a smaller diff on the next `add` is worth more than matching our
  formatting. A newly added primitive tripping another rule gets the rule disabled for the zone.
- **Editing a primitive is re-applied by hand after `shadcn add --overwrite`.** Commit first, and
  keep the edit small enough to re-read out of a diff.
- **A registry entry that is only a thin wrapper over a library is not copied in at all.** Where the
  CLI output adds nothing but props and a dependency of its own — `sonner`, whose shadcn file reads
  a `next-themes` provider this app never mounts — the library is wrapped directly outside `ui/`
  and its own injected CSS is overridden in `shadcn-adapter.css`. One library, not two.

**`cn` from `@/shared/lib/cn` is the only way class names are combined** — it resolves Tailwind
conflicts, which makes a caller's `className` an override rather than a coin flip. Use `cva`
once a component has more than two or three visual variants; below that inline conditionals are
clearer.

## Where the token files live

`src/app/(frontend)/globals.css` imports, in order: `tokens.css` (contract names → Tailwind utilities),
`standard.css` (values on bare `:root`), `dark-fantasy.css` (values behind
`:root[data-theme=…]`), `shadcn-adapter.css`.

`standard` sits on bare `:root` so a surface the Theme mechanism does not reach — anything
rendered before `data-theme` is resolved — still renders in a complete Theme. The dark-fantasy selector carries
`:root` deliberately: a bare attribute selector has the same specificity, which would make the
winner depend on import order.
