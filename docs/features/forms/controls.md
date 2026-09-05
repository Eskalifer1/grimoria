# The `Form.*` control catalog

What each bound control settles, and when to reach past the catalog. How a form is joined to a write
is `docs/features/forms.md`.

## Contents

- The namespace
- The two control layers
- What the catalog settles
- Testing a bound control

## The namespace

One import, dot notation, and **what a form varies it varies by children rather than by another
prop**. The members are `src/shared/components/Form/index.tsx`; each carries its own JSDoc.

**Most forms write `Form.Footer` and nothing else** — `Form.Error`, then `Form.Submit` and an
optional `Form.Cancel`. A form that needs more drops to the primitives underneath rather than
waiting for a prop.

**Every key in `values` is a field the form draws.** A key with no `Form.Field` still absorbs the
server's reason for it, and the footer stands down for a message placed beside nothing.

**`Form.Root` publishes two contexts, and one rule says which to read: what the User typed comes
from `useFormContext()`, what the server said from `useWriteStatus()`.** Not `useFormStatus`, which
is `react-dom`'s name. Server state is read at render and never pushed into react-hook-form —
`setError('root')` is cleared on every submit, a manually set field error is wiped by the next
resolver pass, and `formState` dies with the component while a write in the store survives a reload.

**`Form.Field` merges the resolver's error for a field with the server's** and hands the render prop
a single `error`. The `field` it hands over already carries `id`, `aria-invalid` and
`aria-describedby`, naming only the ids actually rendered.

**`label` is required.** A control resolving to no name at all fails WCAG 2.2 AA 4.1.2; a field that
must show none passes an `sr-only` element. **`required` draws the red `*` and sets
`aria-required`** — the glyph is `aria-hidden`, which is why a test queries the control by role and
name rather than by label text.

**A rule the User needs before typing — a bound, a format — goes in `description`**, where 3.3.2 is
met. `descriptionHidden` keeps it out of the drawn field and leaves it in the accessible
description: reach for it where the rule is only a surprise to someone who cannot see the control
being truncated.

**A form may leave `Form.Error` out and nothing stops it.** Rendering it implicitly would break on
the first wrapper around a child; the guard is this paragraph and a test.

## The two control layers

Every control exists twice, and the second layer is thin.

**Uncontrolled** is the shadcn registry primitive under `src/shared/components/ui/` — value in,
`onChange` out, no knowledge that forms exist. The vendored zone, consumed and never edited
(`styling.md`); `field.tsx` is what the bound layer draws with.

**Bound** is one component per control in the `Form` namespace. It takes `name`, reaches the form
through context, renders `Form.Field` internally, and hands the primitive whatever that control's
value adapter needs.

**Which one:** inside a form, the bound one, always. Outside a form — a filter bar, a settings row
that writes on change — the primitive with your own `useState`. A control the catalog has no entry
for is built on `Form.Field`, which stays public.

**The adapter is the point.** A checkbox wants `checked` and `onCheckedChange`, a Radix select wants
`onValueChange`. Written at the call site that mapping is wrong silently — a checkbox handed `value`
renders unchecked forever and no resolver complains.

**Props spread flat onto the control**, shaped by `BoundControlProps` in `Form/types.ts`, whose
JSDoc names the two holes the type cannot close. No nested `inputProps`. **`disabled` is the one
prop the two sides share** and merges as `field.disabled ?? disabled`: a form closed as a whole
wins, and otherwise the call site's answer stands.

## What the catalog settles

- **`Form.Checkbox` and `Form.Switch` draw their label after the control**, against the box it
  names. `isLabelFirst` asks for the far edge instead: the pattern for a toggle that writes the
  moment it moves, which a toggle inside a form with a submit button is not. **Which field a control
  is bound to is not typechecked** — binding a toggle to a string field compiles. A group of
  checkboxes writing into one array is a `fieldset` with a `legend` and different ARIA, so it is a
  different component when a screen asks for one.
- **`Form.Select` and `Form.RadioGroup` take `options`, not children.** Children would make each
  call site import out of `ui/` and hand-wire an `id`/`htmlFor` pair per radio. A caller wanting
  groups or separators drops to `Select` directly.
- **The radio group is named by `aria-labelledby`** — its root is a `<div role="radiogroup">`, which
  no `<label for>` can reach. Each option's id is built from its **position**, not its value: a value
  with a space in it makes an id the spec disallows and the label stops naming its radio.
- **`Select` is the Radix registry item, not `native-select`.** A native `<select>` carries neither
  Theme's material.

Out of the catalog on purpose: date and combobox (neither is a registry item), number, OTP and
slider. **A numeric field is `Form.Input` with `inputMode="numeric"`** — `type="number"` brings a
scroll wheel that changes the value and a `NaN` on empty.

## Testing a bound control

**A bound control is tested as a binding**, one file per control under
`tests/shared/components/Form/`, rendered inside a real `useForm` with a resolver: the initial value
reaches the control, interacting moves the form's value in that control's own terms, a rejection
marks it `aria-invalid` and points `aria-describedby` at the catalog's words, and a native prop
arrives on the control. **No test in those files passes `control` to anything** — the prop-drilling
rule made executable.

`src/shared/components/ui/**` is not tested (`docs/testing.md`).
