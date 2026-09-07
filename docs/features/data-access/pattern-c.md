# Pattern C — blocking form

The form waits for the server, because the answer cannot be guessed. Which pattern a surface gets is
`docs/features/data-access.md`; this file is everything needed to build one.

## When it is this and not an optimistic write

**When the server's response cannot be anticipated**: server-side validation, a uniqueness check, a
server-generated identifier, anything irreversible, anything moving money. However predictable those
feel, the client does not hold the answer.

## The shape

Call the action and hold the result. There is no store entry, no key and no descriptor — nothing is
optimistic here, so there is nothing to overlay or to roll back.

```tsx
'use client';

const [pending, setPending] = useState(false);
const [failure, setFailure] = useState<ActionFailureDetail | null>(null);

async function handleSubmit(values: NameForm) {
  setPending(true);
  const result = await updateName(values);
  setPending(false);
  setFailure(result.error);
}
```

**The draft survives a failure.** The inputs keep what the User typed; only the message changes.

## The one place refusing a submit is right

**Submit is refused while the request is in flight, and only submit.** This is the only pattern that
refuses anything, and the reason is that the write must not be repeated. The inputs stay live.

**The refusal is `aria-disabled` plus a guard in the form's own submit handler, never the `disabled`
attribute.** A browser blurs a control the moment it is disabled, dropping a keyboard User to the
document body for the length of the write and never bringing them back (WCAG 2.2 AA, 2.4.3). The
guard has to sit on the form rather than the button, because the Enter key submits the form and no
button ever sees it.

**A disabled attribute also says nothing to a screen reader** (4.1.2) — carry `aria-busy` on the
control as well.

## Wiring a field to its message

**`useActionForm` is this pattern** — it holds the failure the write answered
with, reads flight from `isSubmitting`, and locks submit and nothing else. `values` is a seed here,
not a live binding: nothing outside answers with the value, so a form bound to the surface would
revert what it just saved.

```tsx
const { Form } = useActionForm({ schema, values, write: updateName });

<Form.Root>
  <Form.Input label={t('nameLabel')} name="name" />
  <Form.Footer />
</Form.Root>;
```

`Form.Field` owns `aria-invalid` and `aria-describedby`, keeps its message region mounted and
`sr-only` while empty, and merges the resolver's refusal with the server's — the resolver wins,
being the newer answer. **How a form is built here, in full, is `docs/features/forms.md`**; the
rules above are what this pattern leans on.

Server-side field errors arrive as `error.fields`, keyed by field path, **in English and outside
`messages/`** — a diagnostic. What renders is the failure's code, worded from `actionError`, and the
schema's own refusals are worded per rule from `validation`.

## Where it is used

Nothing yet. `src/views/ProfilePage/ProfileNameForm/` is pattern B, and the day a name gains a
uniqueness rule it moves here — it already carries the schema and the form layer this pattern uses.
