# The typed `Form` comes from the hook, not from context

`useOptimisticForm` and `useActionForm` hand back a `Form` namespace bound to the form's values, and
that is what a surface draws with. The untyped `Form` stays as it is, for a form built without either
hook (#105).

Context is not an inference site. A bound control reaches the form through `useFormContext()`, so
`TValues` widens to `Record<string, any>` and `name` is checked as a bare `string`. A mistyped `name`,
or a `Form.Switch` on a string field, compiled and rendered a control that accepted input and wrote
nowhere.

The hooks already know the values type: `schema: z.ZodType<TOutput, TInput>` gives them `TInput` with
no generic written at the call site. `name` is checked against `TInput` rather than `TOutput` because
a control writes into the field — behind a `.transform()` or a `z.coerce`, the field still holds what
was typed.

## Rejected

- **A `control` prop per field.** It restores exactly the drilling #99 removed, on every field of
  every form, to buy a check the hook can give for free.
- **A per-form `createForm<Values>()` factory.** One extra line and one extra name per form, for the
  same inference the hook is already holding.
- **A `Root` built inside the hook, closing over the binding.** It hid the three props, and cost a
  `useMemo` so React would not remount the form, a ref so the one component saw the live binding,
  and a subscription once the React Compiler stopped re-rendering it with its parent.

## Costs accepted

- **`TypedForm<TValues>` is written by hand**, one line per member. A control added to `Form` and not
  listed there fails `tsc` in `tests/shared/components/Form/types.test.tsx`, which is what keeps the
  two namespaces from drifting.
- **The binding is spread by hand.** `Form.Root` is the one root, taking `form`, `writeStatus` and
  `onSubmit` as props; the hook returns them beside `Form`, and the call site writes
  `<Form.Root {...binding}>`. The typed namespace is the untyped one narrowed at the type level —
  nothing is built per form, so nothing has to be memoized or kept live.
- **The hooks import `shared/components/Form`** — a hook depending on a component, the reverse of the
  usual direction, and the one such exception (`layers.md`).
