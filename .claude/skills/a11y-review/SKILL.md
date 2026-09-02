---
name: a11y-review
description: Review a branch's changed React components against every WCAG 2.2 AA criterion Biome can't catch — semantics, names, keyboard, ARIA state, forms and auth, timing, pointer targets, page level, locale. Reads only. /a11y-review [range]; verify-branch axis.
argument-hint: "[range]"
context: fork
agent: general-purpose
background: false
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git merge-base:*), Read, Grep, Glob
---

# Accessibility review over `$0`

**Run the review below now and report what it finds.** Change no code, and ask nothing.

## Contents

1. Gate 2. Read the full file 3. The eleven categories 4. What Biome holds 5. Severity 6. Report

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
name).

**Report on lines this range changed.** A line the range left alone is reportable only where the
change made it wrong — a new `role="list"` around an old child, a lifted state that orphans an
`aria-controls`.

## 3. The eleven categories

**Read `checklist.md` in this directory before judging anything.** It carries every Level A and AA
success criterion in WCAG 2.2 under these eleven headings, with what each one looks like in a React
diff, plus the criteria held by a token or a browser instead.

Walk all eleven per file, in this order. A category applies whether or not the file has interactive
elements — a component rendering one image still fails category 2.

1. **Semantics and structure** — the element carries the meaning, and visual grouping has markup
   behind it. Landmarks placed once each per page, headings descending from a single `h1`.
2. **Accessible name** — every interactive element and every image resolves to a name a screen
   reader can speak, and an `aria-label` never contradicts the visible text.
3. **Keyboard and focus** — every action reachable and operable by key, focus moving into and back
   out of what opens, and never trapped.
4. **ARIA state** — the state properties track real state on every branch, including first render.
5. **Forms** — labels, error wiring, `autocomplete`, confirmation before something irreversible, and
   an authentication path that allows paste and autofill.
6. **Dynamic content** — what changes announces itself, and nothing runs on a timer the User cannot
   stop.
7. **Pointer and target** — no action bound to pointer-down, and every gesture or drag has a plain
   click equivalent.
8. **Page level** — skip link, route title, consistent nav and help placement. Judged on layouts and
   route files, not on every component.
9. **Non-visual cues** — nothing carried by color, shape or position alone.
10. **Locale** — `lang` (and `dir` where the locale needs it) on the document and on inline spans in
    another language; no hardcoded strings.
11. **Layout resilience** — no `px` type scale, no fixed height around growing text, no orientation
    lock.

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

**Color contrast and focus-ring styling are out of scope** — tokens hold them
(`src/styles/standard.css`, `dark-fantasy.css`), and this review reads no rendered pixels. Target
size, reflow and focus obscured by a sticky element are measured in a browser, not here; the
"held elsewhere" table in `checklist.md` says what remains reportable from the code for each.

## 5. Severity

| Severity | What lands here |
| --- | --- |
| `high` | Content or action unreachable by keyboard, or an interactive element with no accessible name. A user cannot complete the task at all. |
| `medium` | Semantics or state wrong — heading order broken, `aria-expanded` lying, a landmark missing or duplicated, an error not tied to its control. The task is completable, the experience is wrong. |
| `low` | Everything else. |

## 6. Report

**Every finding cites a WCAG 2.2 AA success criterion by number and name** — `1.1.1 Non-text
Content`. A finding with no criterion behind it is taste, and `review-boundaries.md` drops it.

Each finding carries: the file and line, one sentence on what breaks, the criterion, and the concrete
fix.

**Called as a review axis by `/verify-branch`** — return the fields /verify-branch asks for, `axis: "a11y"`,
the criterion in the `rule` field.

**Called directly** — a markdown table, most severe first, then one line naming which of the
eleven categories came back clean.

Zero findings is a complete answer. Report it in one line and add nothing.
