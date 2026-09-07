# Forms

How a form is joined to a write: the two hooks, where a refusal is worded, and where a failure
lands. The controls a form draws with are `docs/features/forms/controls.md`; which write pattern a
surface gets is `docs/features/data-access.md`.

## Contents

- The shape
- The two hooks
- Where a refusal comes from
- Where a failure lands
- What is refused
- Testing a form

## The shape

Two calls and a tree. **The hook hands back the namespace the form draws with**, already bound to it:

```tsx
'use client';

const { Form } = useOptimisticForm({
  schema: updateNameSchema,
  values: { name: displayName.value },
  writeStatus: optimisticFormStatus('name', displayName),
  write: (values) => displayName.run(values.name),
});

<Form.Root>
  <Form.Input label={t('nameLabel')} name="name" required />
  <Form.Footer />
</Form.Root>;
```

`src/views/ProfilePage/ProfileNameForm/` is that written out, and the file the next form is copied
from.

**That `Form.Root` takes `className` and `children` and nothing else** — the binding is the hook's.
Every `name` under it is checked against the schema's **input** type, so a typo and a toggle on a
string field both fail `tsc` (ADR 0013). The type is `TypedForm` in
`src/shared/components/Form/typedForm.ts`; a field rendered by a component the form does not own
takes it as one prop rather than losing the check.

**The hook also still returns `form`, `writeStatus` and `onSubmit`** — `form` for `watch`,
`setValue` and `formState`, the three together for the untyped `Form.Root` imported from
`@/shared/components/Form`, which is what a form built without either hook spreads them onto.

## The two hooks

**A form is only ever B or C** — the decision tree in `docs/features/data-access.md` sends every
form to one of those two. **A form picks its hook and carries none of the other's machinery.** Both
sit on `useFormSeam`; the options are typed in `src/shared/hooks/form/`.

- **`useOptimisticForm` is pattern B**, optimistic. The store owns the failure, so it survives a
  reload. `optimisticFormStatus(field, value)` turns a `useOptimisticValue` result into the
  `writeStatus` prop, so the form layer never imports the store and the store never imports the form
  layer. **The hook records nothing** — a second copy would render for a value nothing reads.
- **`useActionForm` is pattern C**, blocking. It holds the failure the write answered with and
  refuses a second submit until the first is back. **Nothing outside a pattern C form knows the
  write happened**: a reload taken before the answer arrives loses the attempt and its reason both.

**Pattern C resets the whole form to the values its `write` answered with.** Nothing else can tell a
blocking form what the server settled on. A refusal resets nothing: the draft stands where the
message asks the User to correct it.

**`resetOptions` is pattern B's alone.** Set for both, its only remaining effect is to be lent to
every hand-written `form.reset()` and quietly turn it into a partial one. Three things it settles:

- **Who owns the write owns the value.** Pattern B binds through React Hook Form's `values`, a live
  binding, so the input follows the store. Pattern C takes `defaultValues`, a seed. **Binding a
  form-owned value to a surface that never moves drags the form back to the value it held before its
  own write.**
- **`keepDirtyValues` and `keepErrors`, in pattern B.** A `values` change resets the form and a
  reset takes both with it: the draft written while the write was out, and the resolver's refusal of
  a value that draft still holds. Those options reach `form.reset()` too — reach for `Form.Reset`
  rather than a hand-rolled reset button.
- **How a settled write ends the draft.** Pattern B releases per field, comparing `===` over the
  top-level raw values, so **a form whose value is an object or an array needs its own reset.**

**A write that never answers is a failure too.** A Server Action rejects rather than returning an
`ActionResult` when the network goes, so the hook catches and records the generic `unexpected` —
uncaught, the form falls silent with a live button and nothing said.

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
sentence per field would multiply by every field and every Theme. A code with no copy fails `tsc` in
`useValidationMessage` rather than reaching a User raw, and a schema still carrying English reads as
the generic `invalidInput`.

**Server-returned `fields` stay a diagnostic.** The client validates with the same schema, so those
English messages reach a User only where the client was bypassed; what renders is the failure's
code, worded from `actionError`.

## Where a failure lands

- **The server named a field** → beside that field, drawn by `Form.Field`, and nowhere else.
- **The server named no field** — no session, no right, offline → the footer, drawn by `Form.Error`,
  above the control that would repeat the write.
- **Both the resolver and the server have something to say about one field** → **the resolver wins.**
  A stale server reason beside a value already corrected is worse than none.

**The server's reason beside a field can be dismissed; the resolver's cannot.** The resolver's goes
the moment the value is corrected, while in pattern B the server's outlives a reload — so a field
drawing one offers the same dismissal the footer does, and dismissing it returns focus to that
field.

**Neither ever prints twice.** `optimisticFormStatus` drops the form-level half whenever the server
named a field. **Nor does either vanish**: that half is dropped only once some field has actually
taken the reason, so a server naming a field this form draws no input for leaves it in the footer.

**One message per field at a time.** The resolver reports the first rule that refused, and the
server's reason for a field is its `code` — so two fields the server named read the same sentence.

**The message under a field is `<MessageRow>`**, mounted from the first render and `sr-only` while
empty (`accessibility.md`). Not `<ErrorRow>`, which words an action failure itself: a field's
refusal may have come from the resolver, so the field words both sides — `useValidationMessage` and
`useActionErrorMessage` — and hands over a sentence.

## What is refused

**`submitLock` is `SUBMIT_LOCK` in `src/constants/form.ts`, and the inputs are never locked.**

- **Pattern B — `none`.** The value is already on screen and a second submit is a second write.
- **Pattern C — `submit`.** The form refuses a second submit while the first is out. The inputs stay
  live and the draft survives. The refusal is `useSkipWhilePending` — a ref rather than a rendered
  flag, because held Enter repeats inside one tick and a flag read off the last render has not heard
  about the write yet.

**Nothing here uses the `disabled` attribute.** A browser blurs a control the moment it is disabled,
dropping a keyboard User to the document body for the length of the write and never bringing them
back (2.4.3). `Form.Submit` says it is refusing with `aria-disabled` and carries `aria-busy`, and
**the refusal itself lives in `Form.Root`'s submit handler** — the Enter key submits the form and no
button ever sees it. Locking a whole form would need `pattern-c.md` changed first.

## Testing a form

**The seam is the rendered form**, never the hook. `tests/shared/components/Form.test.tsx` covers
the layer, `tests/views/ProfilePage/ProfileNameForm.test.tsx` covers pattern B end to end, and the
pattern C lock is covered by a harness form inside the first that calls the hook without a
`writeStatus`. A bound control is tested as a binding — `docs/features/forms/controls.md`.
