// cspell:ignore naem
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { Form } from '@/shared/components/Form';
import type { TypedForm } from '@/shared/components/Form/typedForm';
import { useActionForm } from '@/shared/hooks/form/useActionForm';
import { actionSuccess } from '@/shared/lib/actionResult';

const LABEL = 'Name';

const RANKS = [
  { value: 'novice', label: 'Novice' },
  { value: 'adept', label: 'Adept' },
];

function noop() {
  // The handler a call site would try to write over the binding's own.
}

/**
 * The `Omit` contract of `BoundControlProps`, asserted where it lives — in the
 * types. Nothing here renders: an element is built and thrown away, and `tsc`
 * over the repo is what runs the suite. **An unused `@ts-expect-error` is itself
 * an error**, so a prop the binding stops owning fails this file rather than
 * passing it quietly, which is what a runtime `not.toHaveAttribute` could never
 * do for a prop no call site can write.
 */
describe('a bound control’s props', () => {
  it('refuses every prop the field binding owns', () => {
    const refused = [
      <Form.Input
        key="onChange"
        label={LABEL}
        name="name"
        // @ts-expect-error `onChange` is the field's; a call site's would never run.
        onChange={noop}
      />,
      <Form.Input
        key="value"
        label={LABEL}
        name="name"
        // @ts-expect-error `value` is the form's; the control is bound, not controlled here.
        value="Merlin"
      />,
      <Form.Input
        key="id"
        // @ts-expect-error `id` is the field's, and the label points at it.
        id="name"
        label={LABEL}
        name="name"
      />,
      <Form.Switch
        key="onCheckedChange"
        label={LABEL}
        name="digest"
        // @ts-expect-error the toggle adapter owns `onCheckedChange`.
        onCheckedChange={noop}
      />,
      <Form.Checkbox
        key="checked"
        // @ts-expect-error the toggle adapter owns `checked`.
        checked
        label={LABEL}
        name="terms"
      />,
      <Form.Select
        key="onValueChange"
        label={LABEL}
        name="rank"
        // @ts-expect-error the select adapter owns `onValueChange`.
        onValueChange={noop}
        options={RANKS}
      />,
    ];

    expect(refused).toHaveLength(6);
  });

  it('takes `disabled` and a native prop of the control it wraps', () => {
    const accepted = [
      <Form.Input autoComplete="nickname" key="autoComplete" label={LABEL} name="name" />,
      <Form.Textarea key="rows" label={LABEL} name="bio" rows={6} />,
      <Form.Input disabled key="disabled" label={LABEL} name="name" />,
      <Form.Checkbox disabled key="checkbox" label={LABEL} name="terms" />,
      <Form.Switch disabled key="switch" label={LABEL} name="digest" />,
      <Form.Select disabled key="select" label={LABEL} name="rank" options={RANKS} />,
      <Form.RadioGroup disabled key="radio" label={LABEL} name="rank" options={RANKS} />,
    ];

    expect(accepted).toHaveLength(7);
  });
});

const profileSchema = z.object({
  name: z.string(),
  bio: z.string(),
  age: z.number(),
  terms: z.boolean(),
  rank: z.string(),
});

/**
 * The typed namespace the hook hands back. Nothing renders — the elements are
 * built inside a component that is never mounted, and `tsc` over the repo is what
 * runs these cases.
 */
function TypedProbe() {
  const { Form: Bound } = useActionForm({
    schema: profileSchema,
    values: { name: '', bio: '', age: 0, terms: false, rank: 'novice' },
    write: (values) => Promise.resolve(actionSuccess(values)),
  });

  return (
    <Bound.Root>
      <Bound.Input label={LABEL} name="name" />
      <Bound.Textarea label={LABEL} name="bio" />
      {/* A path, not a value type: a number field takes a text control. */}
      <Bound.Input inputMode="numeric" label={LABEL} name="age" />
      <Bound.Checkbox label={LABEL} name="terms" />
      <Bound.Switch label={LABEL} name="terms" />
      <Bound.Select label={LABEL} name="rank" options={RANKS} />
      <Bound.RadioGroup label={LABEL} name="rank" options={RANKS} />
      <Bound.Field label={LABEL} name="age" render={({ field }) => <input {...field} />} />
      <Bound.Input
        label={LABEL}
        // @ts-expect-error `naem` is no field of this form, so the control would write nowhere.
        name="naem"
      />
      <Bound.Checkbox
        label={LABEL}
        // @ts-expect-error `name` holds a string, and a toggle writes a boolean.
        name="name"
      />
      <Bound.Switch
        label={LABEL}
        // @ts-expect-error `age` holds a number, and a toggle writes a boolean.
        name="age"
      />
      <Bound.Select
        label={LABEL}
        // @ts-expect-error `age` holds a number, and an option is a string.
        name="age"
        options={RANKS}
      />
      <Bound.RadioGroup
        label={LABEL}
        // @ts-expect-error `terms` holds a boolean, and an option is a string.
        name="terms"
        options={RANKS}
      />
      <Bound.Field
        label={LABEL}
        // @ts-expect-error `Form.Field` is bound the same way, so the escape hatch is checked too.
        name="naem"
        // The name is what is under test; a `render` reading the field would report
        // the same rejection a second time, on a line the annotation does not cover.
        render={() => <input />}
      />
      <Bound.Footer />
    </Bound.Root>
  );
}

/** A control listed in `Form` and not in `TypedForm` fails here, and nowhere else. */
type EveryControlIsTyped = keyof typeof Form extends keyof TypedForm<{ name: string }>
  ? true
  : false;

describe('a typed form’s `name`', () => {
  it('is checked against the form’s own values', () => {
    const everyControlIsTyped: EveryControlIsTyped = true;

    expect(everyControlIsTyped).toBe(true);
    expect(TypedProbe).toBeTypeOf('function');
  });
});
