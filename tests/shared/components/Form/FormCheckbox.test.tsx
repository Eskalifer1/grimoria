import { act, fireEvent, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ACTION_ERROR } from '@/constants/action';
import { VALIDATION_ERROR } from '@/constants/validation';
import { Form } from '@/shared/components/Form';
import { useActionForm } from '@/shared/hooks/form/useActionForm';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/lib/actionResult';
import { validationMessage } from '@/shared/lib/validationMessage';

import {
  announced,
  expectNothingAnnounced,
  messages,
  renderWithProviders,
} from '../../../setup/render';

const errorCopy = messages.actionError;
const validationCopy = messages.validation;
const LABEL = 'Accept the terms';
const SAVE = messages.form.save;

const schema = z.object({
  terms: z.boolean().refine((accepted) => accepted, validationMessage(VALIDATION_ERROR.REQUIRED)),
});

interface ProbeProps {
  /** Stands in for the write the form runs. */
  write?: (values: { terms: boolean }) => Promise<ActionResult<{ terms: boolean }, string>>;

  /** A native prop of the control, passed flat to the bound component. */
  title?: string;

  /** How the label sits against the control. Omitted where the default is the subject. */
  orientation?: 'horizontal' | 'vertical';

  /** Whether the label is drawn before the control rather than against it. */
  isLabelFirst?: boolean;

  /** The call site's own refusal, which the field binding is written after. */
  disabled?: boolean;
}

/** A one-field form written the way a screen writes one: no `control`, no `render`. */
function Probe({ write, title, orientation, isLabelFirst, disabled }: ProbeProps) {
  const termsForm = useActionForm({
    schema,
    values: { terms: false },
    write: write ?? ((values) => Promise.resolve(actionSuccess(values))),
  });

  return (
    <Form.Root {...termsForm}>
      <Form.Checkbox
        disabled={disabled}
        isLabelFirst={isLabelFirst}
        label={LABEL}
        name="terms"
        orientation={orientation}
        title={title}
      />
      <Form.Footer />
    </Form.Root>
  );
}

/**
 * A form closed as a whole — `useForm({ disabled: true })`, which no call site
 * prop can stand in for: the field's own `disabled` is what the control must
 * read first.
 */
function DisabledFormProbe() {
  const termsForm = useForm<{ terms: boolean }>({ disabled: true, values: { terms: false } });

  return (
    <Form.Root form={termsForm} onSubmit={() => undefined}>
      <Form.Checkbox label={LABEL} name="terms" />
    </Form.Root>
  );
}

/** By accessible name, which is the label alone — the point of a bound control. */
function termsBox() {
  return screen.getByRole('checkbox', { name: LABEL });
}

/** Submits, and waits for the resolver and the handler the click runs asynchronously. */
async function save() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: SAVE }));
  });
}

describe('Form.Checkbox', () => {
  it('renders from `name` and `label` alone, holding the form’s value', () => {
    renderWithProviders(<Probe />);

    expect(termsBox()).not.toBeChecked();
  });

  it('moves the form’s value as a boolean when the User toggles it', async () => {
    const write = vi.fn((values: { terms: boolean }) => Promise.resolve(actionSuccess(values)));

    renderWithProviders(<Probe write={write} />);
    fireEvent.click(termsBox());
    await save();

    expect(termsBox()).toBeChecked();
    // `true`, not `"on"` — the adapter answers in the type the schema parses.
    expect(write).toHaveBeenCalledWith({ terms: true });
  });

  it('passes a native prop of the control straight through to it', () => {
    renderWithProviders(<Probe title="Terms of use" />);

    expect(termsBox()).toHaveAttribute('title', 'Terms of use');
  });

  it('lays the label beside the control unless told otherwise', () => {
    const { rerender } = renderWithProviders(<Probe />);

    expect(screen.getByRole('group')).toHaveAttribute('data-orientation', 'horizontal');

    rerender(<Probe orientation="vertical" />);

    expect(screen.getByRole('group')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('draws the label after the control, and before it only when asked', () => {
    // `Field`'s horizontal layout gives the label `flex-auto`, so a label drawn
    // first pushes the control to the far edge — the settings row. A toggle in a
    // form wants the opposite: the word against the box it names.
    const slots = () =>
      [...screen.getByRole('group').children].map((node) => node.getAttribute('data-slot'));

    const { rerender } = renderWithProviders(<Probe />);

    expect(slots().indexOf('field-label')).toBeGreaterThan(0);

    rerender(<Probe isLabelFirst />);

    expect(slots().indexOf('field-label')).toBe(0);
  });

  it('lets the call site close the control, which the field binding is written after', () => {
    renderWithProviders(<Probe disabled />);

    expect(termsBox()).toBeDisabled();
  });

  it('closes the control when the whole form is closed', () => {
    renderWithProviders(<DisabledFormProbe />);

    expect(termsBox()).toBeDisabled();
  });

  it('toggles from a click on its drawn label', () => {
    renderWithProviders(<Probe />);
    fireEvent.click(screen.getByText(LABEL));

    expect(termsBox()).toBeChecked();
  });

  it('stays a focusable button in the tab order', () => {
    renderWithProviders(<Probe />);

    // The tab order, read as a number: `tabindex="-2"` is as removed as `"-1"`.
    // **Space is not asserted here** — jsdom synthesizes no click from a keypress
    // and the repo ships no `@testing-library/user-event`, so that the platform
    // activates this button from the keyboard is e2e's (#39). What is held here
    // is that the button is reachable at all.
    expect(termsBox().tagName).toBe('BUTTON');
    expect(termsBox().tabIndex).toBeGreaterThanOrEqual(0);
    termsBox().focus();
    expect(termsBox()).toHaveFocus();
  });

  it('keeps the message region mounted and silent while the value is accepted', () => {
    renderWithProviders(<Probe />);

    expect(termsBox()).toHaveAttribute('aria-invalid', 'false');
    // Present, not merely quiet: a `role="alert"` built at the moment it has
    // something to say is never spoken (`accessibility.md`).
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    expectNothingAnnounced();
  });

  it('marks the control invalid and describes it in the catalog’s words when refused', async () => {
    renderWithProviders(<Probe />);
    await save();

    expect(termsBox()).toHaveAttribute('aria-invalid', 'true');
    // The rule that refused it, in the Theme's words — not the resolver's.
    expect(announced()).toHaveTextContent(validationCopy.required);
    expect(termsBox()).toHaveAccessibleDescription(validationCopy.required);
  });

  it('surfaces a refusal the server pinned on the field beside the control', async () => {
    renderWithProviders(
      <Probe
        write={() =>
          Promise.resolve(
            actionFailure(ACTION_ERROR.INVALID_INPUT, {
              terms: ['withdrawn'],
            }),
          )
        }
      />,
    );
    fireEvent.click(termsBox());
    await save();

    expect(announced()).toHaveTextContent(errorCopy.invalidInput);
    expect(termsBox()).toHaveAttribute('aria-invalid', 'true');
    expect(termsBox()).toHaveAccessibleDescription(errorCopy.invalidInput);
  });
});
