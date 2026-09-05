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
const LABEL = 'Name';
const SAVE = messages.form.save;

const schema = z.object({
  name: z.string().trim().min(1, validationMessage(VALIDATION_ERROR.REQUIRED)),
});

interface ProbeProps {
  /** Stands in for the write the form runs. */
  write?: (values: { name: string }) => Promise<ActionResult<{ name: string }, string>>;

  /** A native prop of the control, passed flat to the bound component. */
  autoComplete?: string;

  /** The call site's own refusal, which the field binding is written after. */
  disabled?: boolean;
}

/** A one-field form written the way a screen writes one: no `control`, no `render`. */
function Probe({ write, autoComplete, disabled }: ProbeProps) {
  const nameForm = useActionForm({
    schema,
    values: { name: 'Merlin' },
    write: write ?? ((values) => Promise.resolve(actionSuccess(values))),
  });

  return (
    <Form.Root {...nameForm}>
      <Form.Input disabled={disabled} autoComplete={autoComplete} label={LABEL} name="name" />
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
  const nameForm = useForm<{ name: string }>({ disabled: true, values: { name: 'Merlin' } });

  return (
    <Form.Root form={nameForm} onSubmit={() => undefined}>
      <Form.Input label={LABEL} name="name" />
    </Form.Root>
  );
}

/** By accessible name, which is the label alone — the point of a bound control. */
function nameInput() {
  return screen.getByRole('textbox', { name: LABEL });
}

/** Submits, and waits for the resolver and the handler the click runs asynchronously. */
async function save() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: SAVE }));
  });
}

describe('Form.Input', () => {
  it('renders from `name` and `label` alone, holding the form’s value', () => {
    renderWithProviders(<Probe />);

    expect(nameInput()).toHaveValue('Merlin');
  });

  it('moves the form’s value as the User types', async () => {
    const write = vi.fn((values: { name: string }) => Promise.resolve(actionSuccess(values)));

    renderWithProviders(<Probe write={write} />);
    fireEvent.change(nameInput(), { target: { value: 'Morgan' } });
    await save();

    expect(nameInput()).toHaveValue('Morgan');
    expect(write).toHaveBeenCalledWith({ name: 'Morgan' });
  });

  it('passes a native prop of the control straight through to it', () => {
    renderWithProviders(<Probe autoComplete="nickname" />);

    expect(nameInput()).toHaveAttribute('autocomplete', 'nickname');
  });

  it('lets the call site close the control, which the field binding is written after', () => {
    renderWithProviders(<Probe disabled />);

    expect(nameInput()).toBeDisabled();
  });

  it('closes the control when the whole form is closed', () => {
    renderWithProviders(<DisabledFormProbe />);

    expect(nameInput()).toBeDisabled();
  });

  it('keeps the message region mounted and silent while the value is accepted', () => {
    renderWithProviders(<Probe />);

    expect(nameInput()).toHaveAttribute('aria-invalid', 'false');
    // Present, not merely quiet: a `role="alert"` built at the moment it has
    // something to say is never spoken (`accessibility.md`).
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    expectNothingAnnounced();
  });

  it('marks the control invalid and describes it in the catalog’s words when refused', async () => {
    renderWithProviders(<Probe />);
    fireEvent.change(nameInput(), { target: { value: '' } });
    await save();

    expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
    // The rule that refused it, in the Theme's words — not the resolver's.
    expect(announced()).toHaveTextContent(validationCopy.required);
    expect(nameInput()).toHaveAccessibleDescription(validationCopy.required);
  });

  it('surfaces a refusal the server pinned on the field beside the control', async () => {
    renderWithProviders(
      <Probe
        write={() =>
          Promise.resolve(
            actionFailure(ACTION_ERROR.INVALID_INPUT, {
              name: ['taken'],
            }),
          )
        }
      />,
    );
    await save();

    expect(announced()).toHaveTextContent(errorCopy.invalidInput);
    expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput()).toHaveAccessibleDescription(errorCopy.invalidInput);
  });
});
