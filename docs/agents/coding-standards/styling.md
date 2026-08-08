# Styling conventions

How code is allowed to express a design decision: which mechanism styles a component, which
values it may name, how shadcn/ui primitives are consumed.

**This document fixes no values.** What a surface looks like is `design/` —
`standard-design.md` and `dark-fantasy-design.md` describe each Theme, `token-contract.md`
names what both must fill, and `src/styles/*.css` holds the values. Read those for _what_;
read this for _how to write it_.

## Tailwind utilities are the styling mechanism

Styles are Tailwind utilities in JSX. No CSS modules, no CSS-in-JS, no component stylesheets.
A `style` prop is for a value that genuinely cannot be known at build time — a computed
offset, a progress width — and never for a colour, a spacing step, or a font.

Handwritten CSS lives in `src/styles/` and holds **tokens only**. A rule that styles a
component does not belong there.

## A value outside the tokens does not compile

`src/styles/tokens.css` removes Tailwind's own colour, radius, shadow, blur, font and easing
scales, so `bg-red-500`, `rounded-xl`, `shadow-lg` and `ease-out` fail to build rather than
quietly shipping a value nothing links to the design system.

Do not add them back. Needing a value the tokens lack means `design/token-contract.md` is
missing a name — and a name is added to **both** Themes in the same change, or not at all.

The one scale still open is font size: the two Themes name their type scales differently, so
Tailwind's `text-*` stays until #79 settles one set of names.

## Spacing is Tailwind's own scale

Every gap, pad and margin is a multiple of 4px, which is exactly what Tailwind's spacing
utilities produce — `p-6` is 24px. There is no spacing token and none is to be added:
declaring one would copy a value the framework already holds.

Anything not a multiple of four is a hairline, a font metric, or a bug.

## A component never asks which Theme is active

No `data-theme` condition in a component, no `dark:` variant, no Tailwind variant registered
for a Theme. Switching Theme is values changing under one set of names, so a component reads
`--surface-card` and gets the right material without knowing which Theme supplied it.

A component that has to branch means the contract is missing a name. Add the name, not the
branch. Tailwind's `dark` variant is deliberately pointed at a class this app never sets
(`src/styles/shadcn-adapter.css`), so `dark:` silently does nothing rather than half-working.

The Theme is also never selected by the operating system — `prefers-color-scheme` chooses
nothing here. See `docs/features/dark-fantasy-theme.md`.

## The vendored zone is consumed, never edited

`src/shared/components/ui/` is CLI output. It is not hand-edited — not to change a token, not
to fix a variant, not to match our formatting.

- shadcn's token vocabulary is translated **once**, in `src/styles/shadcn-adapter.css`. A
  primitive needing a name that file lacks is a decision about what that name means in both
  Themes; make it there.
- Anything we write ourselves, wrappers around a primitive included, lives outside `ui/` under
  the ordinary rules.
- Biome's formatter and import sorting are **off** for that path, and the style rules that
  disagree with the CLI's output are disabled for it. That is what keeps `shadcn add <x>` a
  no-op diff on an unchanged component. When a newly added primitive trips another style rule,
  the rule is disabled for the zone rather than fixed in the generated file.

## Variants and class names

`cn` from `@/shared/lib/cn` is the only way class names are combined — it resolves Tailwind
conflicts, which is what makes a caller's `className` an override rather than a coin flip.

Variant logic uses `cva` once a component has more than two or three visual variants; below
that, inline conditional classes are clearer than a config object.

## Where the token files live

`src/app/globals.css` is the single entry point and imports, in order:

| File | Holds |
| --- | --- |
| `src/styles/tokens.css` | the bridge from contract names to Tailwind utilities |
| `src/styles/standard.css` | `standard`'s values, on bare `:root` |
| `src/styles/dark-fantasy.css` | `dark-fantasy`'s values, behind `:root[data-theme=…]` |
| `src/styles/shadcn-adapter.css` | shadcn's vocabulary, aliased onto the contract |

`standard` sits on bare `:root` so a surface the Theme mechanism does not reach — such as
`/admin`, localized but not themed (ADR-0001) — still renders in a complete Theme. The
dark-fantasy selector carries `:root` deliberately: a bare attribute selector has the same
specificity as `:root`, which would make the winner depend on import order.
