# Forms

How a form is built here: the primitives, the one hook that joins a form to a write, and where a
refusal is worded. Which write pattern a surface gets is `docs/features/data-access.md` — this file
is the form half of B and C alike.

## Contents

- The shape
- `useActionForm`
- The `Form.*` namespace
- The two control layers
- Where a refusal comes from
- Where a failure lands
- What is refused
- Testing a form

## The shape

Two calls and a tree. Both hooks return exactly what `Form.Root` takes, so it spreads:

```tsx
'use client';

const nameForm = useOptimisticForm({
  schema: updateNameSchema,
  values: { name: displayName.value },
  writeStatus: optimisticFormStatus('name', displayName),
  write: (values) => displayName.run(values.name),
});

<Form.Root {...nameForm}>
  <Form.Input label={t('nameLabel')} name="name" required />
  <Form.Footer />
</Form.Root>;
```

`src/views/ProfilePage/ProfileNameForm/` is that written out, and the file the next form is copied
from.

## The two hooks

**A form is only ever B or C** — the four write patterns are chosen by the decision tree in
`docs/features/data-access.md`, and question 5 sends every form to one of those two. **A form picks
its hook, and carries none of the other's machinery**: which pattern a surface is cannot change
between renders, so making one hook answer for both only means every optimistic form allocating
state for a failure a store already holds.

| Hook | Pattern | Who holds the failure |
| --- | --- | --- |
| `useOptimisticForm` | **B**, optimistic | the store, through `writeStatus` |
| `useActionForm` | **C**, blocking | the hook, from the `ActionResult` |

Both take `schema`, `values` and `write`, both return `{ form, writeStatus, onSubmit }`, and both
sit on `useFormSeam` — the `useForm` call, the resolver and the submit that ends the draft, which is
everything neither owner changes.

| Option | What it is |
| --- | --- |
| `schema` | The action's contract schema, checked here and again on the server |
| `values` | Where the form starts, and what it follows where a surface owns the value |
| `write` | Runs once the resolver agrees. Its `ActionResult` is what a blocking form reads |
| `writeStatus` | **`useOptimisticForm` only.** The state of the write, as the store holds it |

**`useOptimisticForm` is pattern B** — the value changes on the keystroke that submits it, and the
store owns the failure, so it survives a reload. `optimisticFormStatus(field, value)` turns a
`useOptimisticValue` result into a `writeStatus`, so the form layer never imports the store and the
store never imports the form layer. The hook records nothing: a second copy would render for a value
nothing reads.

**`useActionForm` is pattern C** — the answer cannot be guessed, so the form waits for it. It holds
the failure the write answered with, reads flight from `isSubmitting`, and refuses a second submit
until the first is back. **Nothing outside a pattern C form knows the write happened**: there is no
store entry, so a reload taken before the answer arrives loses the attempt and its reason both.

**Its `write` answers with the values it saved, and the form is reset to them** — the whole form,
plainly, which is what react-hook-form's own guidance is for a submit that succeeded. Nothing else
can tell a blocking form what the server settled on, and a draft typed while the write was out is
not worth more than the answer to it. A refusal resets nothing: the draft stands where the message
asks the User to correct it.

**`resetOptions` is pattern B's alone.** It governs the reset a `values` change fires, and a form
holding its own value has no `values` — set for both, its only remaining effect is to be lent to
every hand-written `form.reset()` and quietly turn it into a partial one.

Three things it decides once so no form decides them again:

- **Who owns the write owns the value.** In pattern B a store holds it, answers with whatever the
  server normalized it to, and reaches the hook every render as `values` — so the option becomes
  React Hook Form's `values`, a live binding, and the input follows the store. In pattern C the
  answer arrives at the `write` call and nowhere else, so the same option becomes `defaultValues`, a
  seed. **Binding a form-owned value to a surface that never moves is what drags the form back to
  the value it held before its own write**.
- **`resetOptions: { keepDirtyValues: true, keepErrors: true }`, in pattern B.** A change to
  `values` resets the form, and a reset takes both with it by default: the draft written while the
  write was out, and the resolver's refusal of a value that draft still holds. A dismissal moves
  `values`, so without `keepErrors` throwing the write's failure away silently clears the field's
  own. Those options reach `form.reset()` as well, so a hand-rolled reset button there clears
  nothing it looks like it clears — reach for `Form.Reset`.
- **How a settled write ends the draft is the owner's.** Pattern B releases per field — the dirty
  mark is dropped wherever nothing was typed since the write went out, or `keepDirtyValues` pins the
  field against the store's next answer. "Typed into since" is `===` over the top-level raw values,
  not the resolver's output, so **a form whose value is an object or an array needs its own reset**.
  Pattern C resets the whole form to what the server answered with.

**A write that never answers is a failure too.** A Server Action rejects rather than returning one
when the network goes, so the hook catches and records the generic `unexpected` — uncaught, the form
falls silent with a live button and nothing said.

**A write that lands clears the reason the last one failed with**, so a pattern C form never keeps a
banner over a form that has just saved. **Pattern B records nothing** — the store already holds the
failure, and a second copy would render for a value nothing reads.

**A form too exotic for the hook** skips it and passes any `UseFormReturn` to `Form.Root`.

## The `Form.*` namespace

One import, dot notation, and **what a form varies it varies by children rather than by another
prop**.

| Member | What it draws |
| --- | --- |
| `Form.Root` | The `<form>`, and the two contexts its parts read from |
| `Form.Field` | One field: label, description, control, and the one message under it |
| `Form.Input` | A text input, bound |
| `Form.Textarea` | A multi-line input, bound |
| `Form.Checkbox` | A `boolean`, bound, its label beside it |
| `Form.Switch` | A `boolean`, bound, its label beside it |
| `Form.Select` | One string from `options`, bound, in a Radix listbox |
| `Form.RadioGroup` | One string from `options`, bound, drawn as radios |
| `Form.Error` | The failure that belongs to the write and to no field |
| `Form.Actions` | The row a form ends with |
| `Form.Submit` | The button that sends it, labeled `form.save` unless given children |
| `Form.Cancel` | The way out, labeled `form.cancel` unless given children |
| `Form.Reset` | Back to what the server confirmed, labeled `form.reset` unless given children |
| `Form.Footer` | The preset: `Form.Error`, then `Form.Submit` and an optional `Form.Cancel` |

**Most forms write `Form.Footer` and nothing else.** A form that needs more — a link under the
submit row, an editor with no submit row at all — drops to the primitives underneath rather than
waiting for a prop.

**Every key in `values` is a field the form draws.** A key with no `Form.Field` still absorbs the
server's reason for it, and the footer stands down for a message placed beside nothing.

**`Form.Root` publishes two contexts, and one rule says which to read: what the User typed comes
from `useFormContext()`, what the server said from `useWriteStatus()`.** Not `useFormStatus`, which
is `react-dom`'s name. Server state is read at render and never pushed into react-hook-form —
`setError('root')` is cleared on every submit, a manually set field error is wiped by the next
resolver pass, and `formState` dies with the component while a write in the store survives a reload.

**`Form.Field` adds exactly one thing to `Controller`**: it merges the resolver's error for that
field with the server's and hands the render prop a single `error`. The `field` it hands over
already carries `id`, `aria-invalid` and `aria-describedby`, so no call site writes them, and
`aria-describedby` names only the ids that were actually rendered — the description, the message, or
both.

**`label` is required.** Optional, a call site that forgets renders a control resolving to no name
at all (WCAG 2.2 AA, 4.1.2); a field that must show none passes an `sr-only` element.

**`required` draws the red `*` and sets `aria-required`.** The glyph is `aria-hidden`, so the
control still answers to its label alone — which is why a test queries it by role and name rather
than by label text.

**A rule the User needs before typing — a bound, a format — goes in `description`**, which is where
3.3.2 is met. `descriptionHidden` keeps it out of the drawn field and leaves it in the accessible
description: reach for it where the rule is only a surprise to someone who cannot see the control
being truncated, and leave it off where a sighted User would be caught out too.

**`Form.Submit` draws the shared `form.save` when a form passes no label**, and `Form.Cancel` the
shared `form.cancel`. A surface with its own verb passes children.

**A form may leave `Form.Error` out and nothing stops it.** Rendering it implicitly when it is
missing from the children would break on the first wrapper around a child; the guard is this
paragraph and a test.

**The primitives underneath are `src/shared/components/ui/field.tsx`**, from the shadcn registry —
the vendored zone, consumed and never edited (`styling.md`). The legacy `ui/form.tsx` is gone;
blocks pulled from the registry now land in markup this repo already has.

## The two control layers

Every control exists twice, and the second layer is thin.

**Uncontrolled** is the shadcn registry primitive under `src/shared/components/ui/` — value in,
`onChange` out, no knowledge that forms exist. Vendored, consumed and never edited (`styling.md`)

**Bound** is one component per control in the `Form` namespace. It takes `name`, reaches the form
through context, renders `Form.Field` internally, and hands the primitive whatever that control's
value adapter needs.

**Which one:** inside a form, the bound one, always. Outside a form — a filter bar, a settings row
that writes on change — the primitive with your own `useState`. A control the catalog has no entry
for is built on `Form.Field`, which stays public; forking the ARIA wiring is what this layer exists
to prevent.

**The adapter is the point.** `Form.Field` hands a render prop `value` and `onChange`; a checkbox
wants `checked` and `onCheckedChange`, a Radix select wants `onValueChange`. Written at the call
site that mapping is wrong silently — a checkbox handed `value` renders unchecked forever and no
resolver complains. Written here it is written once.

**Props spread flat onto the control**, and a bound component's props are the primitive's own
(`BoundControlProps` in `Form/types.ts`) minus every prop the binding owns, plus `label`,
`description`, `isDescriptionHidden`, `isLabelFirst` and `orientation`. No nested `inputProps`:
there is one slot underneath, so there is nothing to disambiguate.

**What the binding writes, a call site cannot write.** `value`, `defaultValue`, `onChange`,
`onBlur`, `id`, `ref`, `name` and `required` are dropped from the props type, so reaching for one is
a compile error rather than a handler that never fires. A control with Radix names of its own drops
those too — `checked` and `onCheckedChange` on the toggles, `onValueChange` on the option controls.

**`disabled` is the exception, and the one prop the two sides share.** A call site closes a control
for reasons the form knows nothing about, so it stays passable and merges as `field.disabled ??
disabled`: a form closed as a whole wins, and otherwise the call site's answer stands.

Two limits worth knowing before hunting for a bug:

- **`aria-invalid`, `aria-describedby` and `aria-required` are the binding's, and no `Omit` can say
  so** — TypeScript exempts every hyphenated JSX attribute from prop checking, so one written at a
  call site compiles and is then discarded by the spread. A field wanting to say more passes
  `description`.
- **`required` never reaches the DOM** — the form runs `noValidate`, so the native attribute would
  fire nothing. `name` does reach it on `Form.Input`, `Form.Textarea` and the two toggles, because
  react-hook-form's own `field` carries it; it does not on `Form.Select` or `Form.RadioGroup`.

Four things the catalog settles, each once:

- **`Form.Checkbox` and `Form.Switch` hold a `boolean`**, and their label sits beside the control
  through `Form.Field`'s `orientation`, which they default to `horizontal`. **The label is drawn
  after the control**, against the box it names — `Field` gives the label `flex-auto`, so drawing it
  first would push the control to the far edge of the card. That far edge is the settings row, and
  `isLabelFirst` asks for it: the pattern for a toggle that writes the moment it moves, which a
  toggle inside a form with a submit button is not. Control first is what GOV.UK, Carbon and
  shadcn's own `Field` example all draw for a checkbox. **Which field a control
  is bound to is not typechecked** — the form is read from context, so `TValues` has no inference
  site and `name` is checked as a bare `string`. Binding a toggle to a string field compiles.
  A group of checkboxes writing into one array is a
  `fieldset` with a `legend` and different ARIA — a different component, when a screen asks.
- **`Form.Select` and `Form.RadioGroup` take `options: readonly FormOption[]`**, not children.
  Children would make each call site import primitives out of `ui/` and hand-wire an `id`/`htmlFor`
  pair per radio — the render prop this layer removes, one level down. A caller wanting groups or
  separators drops to `Select` directly.
- **The radio group is named by `aria-labelledby`.** Its root is a `<div role="radiogroup">`, which
  no `<label for>` can reach, so the label is handed down wrapped in a span the component owns the id
  of. Each option's own id is built from its **position**, not its value: a value with a space in it
  makes an id the spec disallows and the label stops naming its radio.
- **`Select` is the Radix registry item, not `native-select`.** A native `<select>` carries neither
  Theme's material, and the system picker it gives on mobile does not pay for a control that looks
  like nothing else on the surface.

Out of the catalog on purpose: date and combobox (neither is a registry item), number, OTP and
slider. A numeric field is `Form.Input` with `inputMode="numeric"` — `type="number"` brings a scroll
wheel that changes the value and a `NaN` on empty.

## Where a refusal comes from

**A Zod schema carries catalog keys, not English.** `validationMessage(code, limit)` writes the
message a rule refuses with, `VALIDATION_ERROR` in `src/constants/validation.ts` holds the codes,
and `useValidationMessage` words one in the active Theme:

```ts
const updateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, validationMessage(VALIDATION_ERROR.REQUIRED))
    .max(USER_NAME_MAX_LENGTH, validationMessage(VALIDATION_ERROR.TOO_LONG, USER_NAME_MAX_LENGTH)),
});
```

**Copy is written per rule, with its bound as `limit`, in both catalogs under `validation`** — a
sentence per field would multiply by every field and every Theme. A code with no copy fails `tsc`
in `useValidationMessage` rather than reaching a User raw, and a schema still carrying English reads
as the generic `invalidInput`.

**Server-returned `fields` stay a diagnostic.** The client validates with the same schema, so those
English messages reach a User only where the client was bypassed; what renders is the failure's
code, worded from `actionError`.

## Where a failure lands

- **The server named a field** → beside that field, drawn by `Form.Field`, and nowhere else.
- **The server named no field** — no session, no right, offline → the footer, drawn by `Form.Error`,
  above the control that would repeat the write.
- **Both the resolver and the server have something to say about one field** → **the resolver wins.**
  It is the newer answer, and a stale server reason beside a value already corrected is worse than
  none.

**The server's reason beside a field can be thrown away; the resolver's cannot.** The resolver's
goes the moment the value is corrected, while in pattern B the server's outlives a reload — so a
field drawing one offers the same dismissal the footer does, and dismissing it returns focus to
that field — the thing the message was about, and the thing the User has to change.

**Neither ever prints twice.** `optimisticFormStatus` drops the form-level half whenever the server
named a field, because the store files that failure in both places.

**Nor does either vanish.** The form-level half is dropped only once some field has actually taken
the reason — a server naming a field this form draws no input for, or answering with an empty field
list, leaves it in the footer rather than nowhere.

**One message per field at a time.** The resolver reports the first rule that refused, and the
server's reason for a field is its `code` — so two fields the server named read the same sentence,
because copy is written per code and not per field.

**The message under a field is `<MessageRow>`**, mounted from the first render and `sr-only` while
empty (`accessibility.md`). Not `<ErrorRow>`, which words an action failure itself: a field's
refusal may have come from the resolver, which is no action failure at all, so the field words both
sides — `useValidationMessage` and `useActionErrorMessage` — and hands over a sentence.
`<ErrorRow>` draws that same row for everyone holding failures, `Form.Error` included.

## What is refused

**`submitLock` is `'none' | 'submit'`, and the inputs are never either.**

- **Pattern B, the optimistic write — `none`.** The value is already on screen and a second submit
  is a second write, not a duplicate of the first.
- **Pattern C, the blocking write — `submit`.** The answer cannot be guessed and the write must not be repeated, so the
  form refuses a second submit while the first is out. The inputs stay live, and the draft survives.
  The refusal is `useSkipWhilePending` — a ref rather than a rendered flag, because held Enter repeats
  inside one tick and a flag read off the last render has not heard about the write yet.

**Nothing here uses the `disabled` attribute.** A browser blurs a control the moment it is disabled,
dropping a keyboard User to the document body for the length of the write and never bringing them
back (WCAG 2.2 AA, 2.4.3). `Form.Submit` says it is refusing with `aria-disabled`, and **the refusal
itself lives in `Form.Root`'s submit handler** — the Enter key submits the form and no button ever
sees it.

The button carries `aria-busy` in both cases: an attribute that only dims a control says nothing to
a screen reader (4.1.2). Locking a whole form would need `pattern-c.md` changed first.

## Testing a form

**The seam is the rendered form**, never the hook. `useActionForm` is exercised through a form that
renders, so a test asserts what a User sees. `tests/shared/components/Form.test.tsx` covers the
layer, `tests/views/ProfilePage/ProfileNameForm.test.tsx` covers pattern B end to end, and the
pattern C lock is covered by a harness form inside the first that calls the hook without a `writeStatus`.

**A bound control is tested as a binding**, one file per control under
`tests/shared/components/Form/`, rendered inside a real `useForm` with a resolver: the initial value
reaches the control, interacting moves the form's value in that control's own terms, a rejection
marks it `aria-invalid` and points `aria-describedby` at the catalog's words, and a native prop
arrives on the control. **No test in those files passes `control` to anything** — the prop-drilling
rule made executable.

`src/shared/components/ui/**` is not tested (`docs/testing.md`).
