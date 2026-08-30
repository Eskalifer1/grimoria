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

## The one place disabling is right

**Submit is disabled while the request is in flight, and only submit.** This is the only pattern in
which anything is disabled, and the reason is that the write must not be repeated. The inputs stay
live.

**A disabled attribute says nothing to a screen reader** (WCAG 2.2 AA, 4.1.2) — carry `aria-busy` on
the control as well.

## Wiring a field to its message

`<FormControl>` owns `aria-invalid` and `aria-describedby`, so neither is ever hand-written:

```tsx
<FormField
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('nameLabel')}</FormLabel>
      <FormControl error={failure}>
        <Input {...field} />
      </FormControl>
      <FormFieldMessage error={failure} />
    </FormItem>
  )}
/>
```

Everything but `FormControl` and `FormFieldMessage` is shadcn's, re-exported from
`shared/components/Form` so a surface has one import. Ours replace the two the primitive gets wrong
for us: the vendored control reads only react-hook-form's error, and a field the **server** refused
would be drawn valid; the vendored message unmounts when empty, and an alert region built at the
moment it has something to say is never spoken.

**The message region is mounted from the first render and takes no room while it is empty** — a
`role="alert"` built at the moment it has something to say is never spoken, and a line held under
every field costs the form more than the shift a rare failure makes (`components.md`).

**Both refusals are worded from the `actionError` catalog, never from the resolver.** The schema
rejecting a field reads as `invalidInput`; the server's own code words itself. The schema wins when
both have something to say — it is the newer answer, and a stale server reason beside a value the
User has already corrected is worse than none. A valid field is `aria-invalid="false"` and describes
nothing. `message` is the escape hatch for a form whose rejection means more than "invalid".

Server-side field errors arrive as `error.fields`, keyed by field path, **in English and outside
`messages/`** — a diagnostic, not something to render. Localized field errors are #97.

## Where it is used

`src/views/ProfilePage/ProfileNameForm/` is the standing example, and it is **the surface that
started this work by getting it wrong**: it disables its submit from a flight state that should have
been optimistic. Its rewrite is #97.
