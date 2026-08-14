---
name: a11y-review
description: Review a branch's changed React components for accessibility defects that Biome's static a11y rules cannot see — semantics, accessible names, keyboard reach, ARIA state, form wiring, dynamic states, and locale markup. Reads code only; runs no browser and repairs nothing. Invoked as /a11y-review [range], and by /verify-branch as the a11y axis.
argument-hint: "[range]"
context: fork
agent: general-purpose
background: false
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git merge-base:*), Read, Grep, Glob
---

# Accessibility review over `$0`

**Run the review below now and report what it finds.** Change no code, and ask nothing.

**The range is `$0`, or `dev` when `$0` is empty.**

**`dev`, not `dev...HEAD`.** `/implement-issue` hands the branch over uncommitted, so a three-dot
range compares two commits and reports an empty diff over a branch full of work.

What this repo promises accessibility-wise is
`docs/agents/coding-standards/accessibility.md`. What a review may report at all is
`docs/agents/coding-standards/review-boundaries.md` — read it before reporting anything.

## 1. Gate — is there a rendered surface in this range?

```sh
git diff --name-only <range> -- 'src/views/**/*.tsx' 'src/features/**/*.tsx' 'src/entities/**/*.tsx' 'src/shared/components/**/*.tsx' 'src/app/(frontend)/**/*.tsx'
```

**Those five trees are the surfaces a User reaches, and they are the whole scope of this review.**
`src/app/(payload)/` is Payload's own admin UI, vendored, not authored here; `src/admin/` renders
inside that admin, which the maintainer alone reaches (`docs/features/auth.md`). Neither carries an
accessibility level this repo holds.

**Empty list means zero findings.** Report the empty result and stop — no reading, no reasoning
about what a future component might do.

## 2. Read the full file, judge the changed lines

Read every changed `.tsx` whole, plus each file that renders a changed component (`grep` its export
name). A `<button>` is correct or broken only against the element that contains it, and the diff
hunk hides that.

**Report on lines this range changed.** A line the range left alone is reportable only where the
change made it wrong — a new `role="list"` around an old child, a lifted state that orphans an
`aria-controls`.

## 3. The seven categories

Walk all seven per file, in this order. Each holds an accessible-name check, so a component with no
interactive elements still fails category 2 if it renders an image.

1. **Semantics** — the element carries the meaning: `button` for an action, `a[href]` for a
   destination, `ul`/`li` for a list, `nav`/`main`/`header`/`footer` landmarks placed once each per
   page. Heading levels descend by one and start at a single `h1`.
2. **Accessible name** — every interactive element and every image resolves to a name a screen
   reader can speak: visible text, `aria-label`, `aria-labelledby`, or `alt`. Icon-only controls and
   links whose only content is a glyph are the usual break.
3. **Keyboard** — every action reachable and operable with Tab, Enter, Space, Escape, and arrow keys
   where a widget pattern expects them. Focus moves into an opened dialog or menu and returns to the
   trigger on close. DOM order matches reading order, so tab order follows it.
4. **State** — `aria-expanded`, `aria-current`, `aria-selected`, `aria-pressed`, `aria-disabled`
   track the component's real state on every branch, including the initial render.
5. **Forms** — each control has a `label` bound by `htmlFor`/`id`. Validation errors are tied to the
   control by `aria-describedby` and marked `aria-invalid`; the submit path moves focus to the first
   error.
6. **Dynamic** — loading, empty, and error states announce themselves: `aria-live` or `role="status"`
   on the region that swaps, `aria-busy` on the control that is waiting. Content appearing after a
   user action without a live region is silent to a screen reader.
7. **Locale** — `lang` (and `dir` where the locale needs it) is set on the document and on any inline
   span in another language. Text nodes come from `next-intl` per
   `docs/agents/coding-standards/i18n.md`; a hardcoded string is unlocalized to a screen reader as
   much as to the eye.

`src/admin/` is the maintainer's own admin surface — **report only `high` findings there** and skip
the rest.

## 4. What Biome already holds — never report these

Biome runs the full `a11y` recommended preset (`biome.json`), so these are red at the gate before a
review ever starts. A finding naming one of them means the gate is broken, not the code:

```
noAccessKey noAmbiguousAnchorText noAriaHiddenOnFocusable noAriaUnsupportedElements noAutofocus
noDistractingElements noHeaderScope noInteractiveElementToNoninteractiveRole noLabelWithoutControl
noNoninteractiveElementToInteractiveRole noNoninteractiveTabindex noPositiveTabindex noRedundantAlt
noRedundantRoles noStaticElementInteractions noSvgWithoutTitle useAltText useAnchorContent
useAriaActivedescendantWithTabindex useAriaPropsForRole useAriaPropsSupportedByRole useButtonType
useFocusableInteractive useGenericFontNames useHeadingContent useHtmlLang useIframeTitle
useKeyWithClickEvents useKeyWithMouseEvents useMediaCaption useSemanticElements useValidAnchor
useValidAriaProps useValidAriaRole useValidAriaValues useValidAutocomplete useValidLang
```

The value this review adds is what a single-file lint rule cannot see: the name a component resolves
to across its props, focus and reading order across elements, state that lies on one branch,
announcement of a state change, and the label bound in a different file.

**Color contrast and focus-ring styling are out of scope** — tokens hold them
(`src/styles/standard.css`, `dark-fantasy.css`), and this review reads no rendered pixels.

## 5. Severity

| Severity | What lands here |
| --- | --- |
| `high` | Content or action unreachable by keyboard, or an interactive element with no accessible name. A user cannot complete the task at all. |
| `medium` | Semantics or state wrong — heading order broken, `aria-expanded` lying, a landmark missing or duplicated, an error not tied to its control. The task is completable, the experience is wrong. |
| `low` | Everything else. |

## 6. Report

**Every finding cites a WCAG 2.2 AA success criterion by number and name** — `1.1.1 Non-text
Content`, `2.1.1 Keyboard`, `2.4.6 Headings and Labels`, `4.1.2 Name, Role, Value`. A finding with no
criterion behind it is taste, and `review-boundaries.md` drops it.

Each finding carries: the file and line, one sentence on what breaks, the criterion, and the concrete
fix.

**Called as a review axis by `/verify-branch`** — return the fields /verify-branch asks for, `axis: "a11y"`,
the criterion in the `rule` field.

**Called directly** — a markdown table, most severe first, then one line naming which of the seven
categories came back clean.

Zero findings is a complete answer. Report it in one line and add nothing.
