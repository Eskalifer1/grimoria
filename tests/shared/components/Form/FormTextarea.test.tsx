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
const LABEL = 'Bio';
const SAVE = messages.form.save;

const schema = z.object({
  bio: z.string().trim().min(1, validationMessage(VALIDATION_ERROR.REQUIRED)),
});

interface ProbeProps {
  /** Stands in for the write the form runs. */
  write?: (values: { bio: string }) => Promise<ActionResult<{ bio: string }, string>>;

  /** A native prop of the control, passed flat to the bound component. */
  rows?: number;

  /** The call site's own refusal, which the field binding is written after. */
  disabled?: boolean;
}

/** A one-field form written the way a screen writes one: no `control`, no `render`. */
function Probe({ write, rows, disabled }: ProbeProps) {
  const bioForm = useActionForm({
    schema,
    values: { bio: 'A hedge wizard.' },
    write: write ?? ((values) => Promise.resolve(actionSuccess(values))),
  });

  return (
    <Form.Root {...bioForm}>
      <Form.Textarea disabled={disabled} label={LABEL} name="bio" rows={rows} />
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
  const bioForm = useForm<{ bio: string }>({ disabled: true, values: { bio: 'A hedge wizard.' } });

  return (
    <Form.Root form={bioForm} onSubmit={() => undefined}>
      <Form.Textarea label={LABEL} name="bio" />
    </Form.Root>
  );
}

/** By accessible name, which is the label alone — the point of a bound control. */
function bioTextarea() {
  return screen.getByRole('textbox', { name: LABEL });
}

/** Submits, and waits for the resolver and the handler the click runs asynchronously. */
async function save() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: SAVE }));
  });
}

describe('Form.Textarea', () => {
  it('renders from `name` and `label` alone, holding the form’s value', () => {
    renderWithProviders(<Probe />);

    expect(bioTextarea()).toHaveValue('A hedge wizard.');
  });

  it('moves the form’s value as the User types', async () => {
    const write = vi.fn((values: { bio: string }) => Promise.resolve(actionSuccess(values)));

    renderWithProviders(<Probe write={write} />);
    fireEvent.change(bioTextarea(), { target: { value: 'A court magician.' } });
    await save();

    expect(bioTextarea()).toHaveValue('A court magician.');
    expect(write).toHaveBeenCalledWith({ bio: 'A court magician.' });
  });

  it('passes a native prop of the control straight through to it', () => {
    renderWithProviders(<Probe rows={6} />);

    expect(bioTextarea()).toHaveAttribute('rows', '6');
  });

  it('lets the call site close the control, which the field binding is written after', () => {
    renderWithProviders(<Probe disabled />);

    expect(bioTextarea()).toBeDisabled();
  });

  it('closes the control when the whole form is closed', () => {
    renderWithProviders(<DisabledFormProbe />);

    expect(bioTextarea()).toBeDisabled();
  });

  it('keeps the message region mounted and silent while the value is accepted', () => {
    renderWithProviders(<Probe />);

    expect(bioTextarea()).toHaveAttribute('aria-invalid', 'false');
    // Present, not merely quiet: a `role="alert"` built at the moment it has
    // something to say is never spoken (`accessibility.md`).
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    expectNothingAnnounced();
  });

  it('marks the control invalid and describes it in the catalog’s words when refused', async () => {
    renderWithProviders(<Probe />);
    fireEvent.change(bioTextarea(), { target: { value: '' } });
    await save();

    expect(bioTextarea()).toHaveAttribute('aria-invalid', 'true');
    expect(announced()).toHaveTextContent(validationCopy.required);
    expect(bioTextarea()).toHaveAccessibleDescription(validationCopy.required);
  });

  it('surfaces a refusal the server pinned on the field beside the control', async () => {
    renderWithProviders(
      <Probe
        write={() => Promise.resolve(actionFailure(ACTION_ERROR.INVALID_INPUT, { bio: ['rude'] }))}
      />,
    );
    await save();

    expect(announced()).toHaveTextContent(errorCopy.invalidInput);
    expect(bioTextarea()).toHaveAttribute('aria-invalid', 'true');
    expect(bioTextarea()).toHaveAccessibleDescription(errorCopy.invalidInput);
  });
});
