import { describe, expect, it } from 'vitest';

import { Form } from '@/shared/components/Form';

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
