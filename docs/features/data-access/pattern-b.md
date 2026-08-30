# Pattern B — optimistic, with feedback

The write shows at once, and a failure reaches the User. Which pattern a surface gets is
`docs/features/data-access.md`.

## Contents

- The shape
- One field
- A control with no half-state
- A record
- A list
- The rules the components hold
- A key is never written by hand
- Forms
- Where it is used

## The shape

**The server's value is a prop; the store supplies what is different about it.** A Server Component
reads the row and passes it down; only the leaf that subscribes is `"use client"`.

**A write is run through a descriptor**, which carries the action, the key it addresses, and where
in the answer the new value lives. Descriptors live beside their action —
`src/api/user/updateName/optimistic.ts` is the worked example.

## One field

`useOptimisticValue` — one field of one record.

```tsx
'use client';

const title = useOptimisticValue({
  descriptor: updateNoteOptimistic,
  input: { id: note.id },
  field: 'title',
  value: note.title,
  version: note.updatedAt,
});

// title.value  title.isPending  title.pendingAction  title.error  title.run(next)  title.dismiss()
```

`version` is the
server's `updatedAt`; it is what lets the overlay die once the render catches up, and leaving it out
pins a stale value on screen.

`<OptimisticField>` takes the same options and draws the result — value, dimming, error row — for a
leaf that only displays.

**A field's dismissal takes that field and nothing else.** The record's copy of the reason goes with
it when the two share an attempt; another field's unsaved value never does.

## A control with no half-state

**A toggle, a switch, a Theme picker takes `onFailure: 'rollback'`.** The field goes back to the
server's value and the reason still shows. A switch has nowhere to hold a value the server refused,
so the default leaves the message explaining a state the User can see is not true.

```tsx
const theme = useOptimisticValue({
  descriptor: setThemeOptimistic,
  input: { id: user.id },
  field: 'theme',
  onFailure: 'rollback',
  value: user.theme,
  version: user.updatedAt,
});
```

`tests/shared/hooks/useOptimisticValue.test.tsx` — "hands the field back to the server and says
why" — is the shape, until the Theme toggle lands.

## A record

`useOptimisticRecord` — several fields of one record, each with its own flight state.

```tsx
const note = useOptimisticRecord({
  descriptor: updateNoteOptimistic,
  input: { id: row.id },
  values: { title: row.title, body: row.body },
  version: row.updatedAt,
});

await note.run({ title: 'Renamed' });
// note.values.title  note.pendingFields.title  note.fieldErrors.title  note.dismiss('title')
```

## A list

`useOptimisticList` — inserts and removals. The row is minted with a client-generated id
(ADR-0010), so it is addressable before the server has ever seen it and **keeps its identity when
the answer lands**.

```tsx
const notes = useOptimisticList({
  items: serverNotes,
  add: createNoteOptimistic,
  remove: deleteNoteOptimistic,
  identify: (item) => ({ id: item.id }),
  draft: (input) => ({ id: input.id, title: input.title, body: '', done: false, updatedAt: '' }),
});

await notes.add({ id: newId(), title: 'Buy milk' });
// notes.items: { key, item, pendingAction, error, isDraft }[]
```

Render each row through `<OptimisticRow>`:

```tsx
<ul>
  {notes.items.map((row) => (
    <OptimisticRow key={row.key} error={row.error} isDraft={row.isDraft}
      pendingAction={row.pendingAction} onDismiss={() => notes.dismiss(row.item)}>
      <span>{row.item.title}</span>
    </OptimisticRow>
  ))}
</ul>
```

## The rules the components hold

**A pending indicator waits 200 ms**, and errors are never delayed. `usePendingDelay` owns the
threshold; no surface writes its own.

**Dimming never disables.** No
component here renders `disabled` or `aria-disabled` from flight.

**Failure rendering follows what the server has.** A failed update or removal returns to full
opacity — the row exists. A failed insert stays dim — it does not. **The message is never dimmed
either way**, and what is dimmed is at 70% (`accessibility.md`).

**Screen readers hear failures only.** `role="alert"` on the message, `aria-busy` on the element
while in flight. The region is mounted before it has anything to say, or it is never spoken; a
dismissal moves focus to what outlived it (`accessibility.md`).

**A row holds no space for a message it has not been given** (`components.md`).

**A form draws the record's failure only when no input claims it.** A failure the server named a
field for is filed beside that input *and* at the record. **The hook answers which is which** —
`value.fieldError`, `record.fieldErrors[field]` — and both are empty unless the server named that
input.

**A leaf inside a row draws only its own field's failure.** `<OptimisticField errorScope="field">`
— the row owns the key and already draws everything recorded against it, so the default prints the
same failure twice.

**Copy comes from `next-intl`, and the store holds codes.** `<ErrorRow>` and `<StatusDot>` word a
code themselves; a surface passes no strings in.

The rest of the family: `<StatusDot>` where a sentence does not fit, `<BrickRoadDot>` over a
collapsed branch (fed by `useBrickRoad`, which answers `null` when nothing below is wrong), and
`<OfflineIndicator>`, which is signage only — a write made offline still goes out and still fails
(ADR-0012).

## A key is never written by hand

A call site hands over an input and the descriptor builds the key. The store and `runOptimistic` are
**unreachable from `app/`, `views/`, `features/` and `entities/`** — Biome refuses the import. A key
format is spelled in exactly one file per domain (`src/api/user/userOptimisticKeys.ts`).

**`<OptimisticScope>` is mounted once, in the locale layout**, above everything and before it in the
JSX. One `localStorage` slot serves the whole browser, so a machine two Users share would otherwise
render the first one's unsaved work to the second — and a screen that forgot to mount it would be
that machine. No page mounts its own.

A descriptor's input is what the key is built from, and it may be **wider than the action's own**:
`updateName` takes a name and no id, 
but the key needs a User to point at. The descriptor is declared over `{ id, name }`, and the
action's schema strips the id back off before the write.

## Forms

**react-hook-form owns the field; the store owns the write.**:

| Owned by react-hook-form | Owned by the store |
| --- | --- |
| Field state, `touched`, `isSubmitting` | The optimistic value |
| Client-side validation, from the action's own Zod schema | The failure, until it is dismissed or fixed |
| Nothing that outlives the component | Everything that crosses a reload |

**The resolver is built from the action's contract schema** — `zodResolver(updateNameSchema)`, one
schema checked in the browser and again on the server.

**The field follows the optimistic value through `values`, never `defaultValues`.** The optimistic
value is the half that survives a reload, so a failed save comes back with what was typed still in
the field and the reason still under it — but `defaultValues` is read once, at mount.

**`values` carries the answer back only into a field nothing was typed into since.** The form is
built with `resetOptions: { keepDirtyValues: true }`, and the submit clears the dirty mark itself
once it has checked that the field still holds what it sent. Without the option, an answer landing
while the User typed again takes what they typed; without the clear, a name the server normalized
never reaches the input and the next save reverts it.

**Where a server failure lands is decided by whether it names a field.** A code carrying
`fields.<name>` is about the value and renders through `<FormFieldMessage>` beside the input; anything
else — no session, no right — is about the write and is handed to `<Form error={...}>`, which draws
it under the fields and above the submit row. The client's own rejection is worded from the same
`invalidInput` key the server's would be, so Zod's English never reaches a User.

**`<Form>` owns the error row and the submit row.** A screen passes `error`, `onDismiss`,
`submitLabel` and — where there is somewhere to go back to — `onCancel`; it writes no `<ErrorRow>` and
no submit button of its own. Written per form, each one would decide the order and the focus return
again, and a form that forgot the message would refuse silently.

## Saying the app is busy, globally

`<SyncProgressBar>` is the one indicator that speaks for the whole store rather than for a key:
`useIsSyncing` asks `hasPendingEntry` of the snapshot, behind the same
`OPTIMISTIC_PENDING_DELAY_MS` threshold every other pending state uses, so a save that answers in
80 ms draws nothing. Mounted once in the locale layout, at the top of the page until there is a
header for it to sit under.

**It is `aria-hidden`.** Every surface already announces its own flight through `aria-busy` and its
status region, and a second voice for the same thing says it twice (`accessibility.md`). The bar is
the glance version of what is already spoken.

**Its presence is the signal, not its movement.** A User who asked for reduced motion gets the bar
without the sweep — `globals.css` switches `--animate-sync-sweep` and `--animate-sync-trail` off by
name rather than collapsing their duration, which would strobe.

## Where it is used

`src/views/ProfilePage/ProfileNameForm/` is the reference, and the file every later form is copied
from. Sign-in and sign-up (#1) come next.

A name has no uniqueness
rule and no server-side transformation. **The day one appears, the
form moves to pattern C**.

What proves the list and record hooks is
`tests/shared/hooks/*.test.tsx`, running against the notes double in `tests/fixtures/notes/`.
