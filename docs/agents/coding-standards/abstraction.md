# Abstraction and reuse

When to factor something out, and what shape it takes so the second caller does not have to
re-derive it. **Every layer is held to this** — a component, a hook, a style and a test as much as a
server call. Where code lives is `layers.md`; how a type is written is `typescript.md`.

## Name the values

**A value carrying meaning is a named constant, read through one object.** A status, a role, an
error code, a limit — `ACTION_STATUS.SUCCESS`, not `'success'` at the call site. The literal is
written once, in `src/constants/<subject>.ts`, and the union type is derived from the object
(`type ActionStatus = (typeof ACTION_STATUS)[keyof typeof ACTION_STATUS]`), so renaming a value is
one edit and a typo fails `tsc` instead of quietly comparing false.

**A set of related values is one object, not loose names**, because they are read as a set and one
import pulls the whole vocabulary.

## Write a cross-cutting step once

**A step every member of a family performs belongs to a wrapper, not to each member.** Resolving
the session, parsing input, mapping a thrown error to a code, logging the outcome, revalidating
after a write — each is written once and applied by construction, so a new member cannot forget it.
`src/api/core/createAction.ts` is the worked example.

**The wrapper takes the boilerplate and leaves the decision.** What differs per member stays
visible in the member: the schema, the authorization predicate, the work itself. A wrapper that
also decides who may act hides the thing a reviewer came to read.

**The second occurrence is the trigger**, not the third — the same rule of two `layers.md` applies
to code moving down a layer.

## Design the shape for the second caller

**A helper is generic over the domain it serves, or it is not a helper.** Anything on a boundary —
`shared/`, `api/core/` — takes its inputs by name, returns a value rather than throwing, and knows
nothing about the one surface that happens to need it first.

**A result is one union with every branch's fields declared.** Both members carry both fields
(`data: null` on the failure, `error: null` on the success), so a caller reads the shape before
narrowing and impossible states — a success with an error — cannot be written down. The discriminant
is `status`, from the constant.

**A family of outcomes is one shared vocabulary, not one per feature.** Statuses, error codes, sizes,
variants — a feature adds a member to the existing set rather than starting a private one beside it,
so a consumer learns the vocabulary once. `data-access.md` holds the set every server call answers
with.

## Reuse on the client

**A component receives what it renders.** Its data arrives as props from the surface that owns it; a
leaf reaching for its own data can only ever be placed where that data exists. `components.md` holds
the boundary this follows from.

**A second variation is a prop, not a second file.** Two components differing by a color, a size or a
label are one component and a variant — `styling.md` for how the variant is expressed.

**A hook is named for the behavior it performs**, never for the screen that needed it first:
`useOptimisticAction`, not `useProfileNameForm`. A hook that cannot serve a second screen is
component-local code that has not been inlined yet.

## Document what leaves the module

**Every field of an exported options or result type carries its own line** — what it is for, what
its edges are, who owns it. The interface is the contract a caller reads instead of the
implementation; a field left bare is the one they will use wrongly. `documentation.md` holds the
rest of the JSDoc rule.
