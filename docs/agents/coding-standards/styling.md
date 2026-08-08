# Styling conventions

> **Scope.** How code is allowed to express a design decision: which mechanism styles a
> component, which values it may name, and how shadcn/ui primitives are consumed.
>
> **This document fixes no values, and it is not where you look to find out what something
> looks like.** That lives in `design/`: `standard-design.md` and `dark-fantasy-design.md`
> describe each Theme, `standard-tokens.md` and `dark-fantasy-tokens.md` hold its values, and
> `token-contract.md` names what both must fill. Read those to know *what*; read this to know
> *how to write it*.
>
> These are settled rules, not options. Where a rule is machine-enforced, the enforcing
> config is named — that config is the source of truth, not this document.

---

## 1. Tailwind utilities are the styling mechanism

Styles are Tailwind utilities in JSX. No CSS modules, no CSS-in-JS, no component stylesheets.
A `style` prop is for a value that genuinely cannot be known at build time — a computed
offset, a progress width — and never for a colour, a spacing step, or a font.

Handwritten CSS lives in `src/styles/` and holds **tokens only**. A rule that styles a
component does not belong there.

## 2. A value outside the tokens does not compile

`src/styles/tokens.css` removes Tailwind's own colour, radius, shadow, blur, font and easing
scales. `bg-red-500`, `rounded-xl`, `shadow-lg` and `ease-out` therefore fail to build rather
than quietly shipping a value nothing links to the design system.

Do not add them back. Needing a value the tokens lack is a signal that
`design/token-contract.md` is missing a name — and a name is added to **both** Themes' value
documents in the same change, or not at all.

The one scale still open is font size: the two value documents name their type scales
differently, so Tailwind's `text-*` remains in place until #79 settles one set of names.

## 3. Spacing is Tailwind's own scale

Every gap, pad and margin is a multiple of 4px, which is exactly what Tailwind's spacing
utilities produce — `p-6` is 24px. There is no spacing token and none is to be added:
declaring one would copy a value the framework already holds.

Anything not a multiple of four is a hairline, a font metric, or a bug.

## 4. A component never asks which Theme is active

No `data-theme` condition in a component, no `dark:` variant, and no Tailwind variant
registered for a Theme. Switching Theme is values changing under one set of names, so a
component reads `--surface-card` and gets the right material without knowing which Theme
supplied it.

A component that has to branch means the contract is missing a name. Add the name; do not
add the branch. Tailwind's `dark` variant is deliberately pointed at a class this app never
sets (`src/styles/shadcn-adapter.css`), so `dark:` silently does nothing rather than
half-working.

The Theme is also never selected by the operating system — `prefers-color-scheme` chooses
nothing here. See `docs/features/dark-fantasy-theme.md`.

## 5. The vendored zone is consumed, never edited

`src/shared/components/ui/` is CLI output (`general.md` §7.1). It is not hand-edited — not
to change a token, not to fix a variant, and not to match our formatting.

- shadcn's token vocabulary is translated **once**, in `src/styles/shadcn-adapter.css`. A
  primitive needing a name that file lacks is a decision about what that name means in both
  Themes; make it there.
- Anything we write ourselves, including a wrapper around a primitive, lives outside `ui/`
  under the ordinary rules.
- Biome's formatter and import sorting are **off** for that path, and the style rules that
  disagree with the CLI's output are disabled for it — `biome.json` → `overrides`. That is
  what keeps `shadcn add <x>` a no-op diff on an unchanged component. When a newly added
  primitive trips another of our style rules, the rule is disabled for the zone; it is not
  fixed in the generated file.

## 6. Variants and class names

`cn` from `@/shared/lib/cn` is the only way class names are combined — it resolves Tailwind
conflicts, which is what makes a caller's `className` an override rather than a coin flip.

Variant logic uses `cva` once a component has more than two or three visual variants; below
that, inline conditional classes are clearer than a config object.

## 7. Where the token files live

`src/app/globals.css` is the single entry point and imports, in order:

| File | Holds |
| --- | --- |
| `src/styles/tokens.css` | the bridge from contract names to Tailwind utilities |
| `src/styles/standard.css` | `standard`'s values, on bare `:root` |
| `src/styles/dark-fantasy.css` | `dark-fantasy`'s values, behind `:root[data-theme=…]` |
| `src/styles/shadcn-adapter.css` | shadcn's vocabulary, aliased onto the contract |

`standard` sits on bare `:root` so that a surface the Theme mechanism does not reach — such
as `/admin`, which is localized but not themed (ADR-0001) — still renders in a complete
Theme. The dark-fantasy selector carries `:root` deliberately: a bare attribute selector has
the same specificity as `:root`, which would make the winner depend on import order.
