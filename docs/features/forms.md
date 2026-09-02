# Forms

How a form is built here: the primitives, the one hook that joins a form to a write, and where a
refusal is worded. Which write pattern a surface gets is `docs/features/data-access.md` — this file
is the form half of B and C alike.

## Contents

- The shape
- `useActionForm`
- The `Form.*` namespace
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
  <Form.Field
    label={t('nameLabel')}
    name="name"
    render={({ field }) => <Input {...field} />}
    required
  />
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

`src/shared/components/ui/**` is not tested (`docs/testing.md`).
