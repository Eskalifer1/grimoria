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
const LABEL = 'Rank';
const PLACEHOLDER = 'Choose a rank';
const SAVE = messages.form.save;

const RANKS = [
  { value: 'novice', label: 'Novice' },
  { value: 'adept', label: 'Adept' },
];

const schema = z.object({
  rank: z.string().min(1, validationMessage(VALIDATION_ERROR.REQUIRED)),
});

interface ProbeProps {
  /** Stands in for the write the form runs. */
  write?: (values: { rank: string }) => Promise<ActionResult<{ rank: string }, string>>;

  /** Where the field starts. Empty is the value the resolver refuses. */
  rank?: string;

  /** A prop of the control, passed flat to the bound component. */
  className?: string;

  /** The call site's own refusal, which the field binding is written after. */
  disabled?: boolean;
}

/** A one-field form written the way a screen writes one: no `control`, no `render`. */
function Probe({ write, rank = 'novice', className, disabled }: ProbeProps) {
  const rankForm = useActionForm({
    schema,
    values: { rank },
    write: write ?? ((values) => Promise.resolve(actionSuccess(values))),
  });

  return (
    <Form.Root {...rankForm}>
      <Form.Select
        className={className}
        disabled={disabled}
        label={LABEL}
        name="rank"
        options={RANKS}
        placeholder={PLACEHOLDER}
      />
      <Form.Footer />
    </Form.Root>
  );
}

/**
 * A form closed as a whole — `useForm({ disabled: true })`, which no call site
 * prop can stand in for: the field's own `disabled` is what the control must
 * read first. It lands on the `Select` root here, not on the trigger the rest of
 * the props reach.
 */
function DisabledFormProbe() {
  const rankForm = useForm<{ rank: string }>({ disabled: true, values: { rank: 'novice' } });

  return (
    <Form.Root form={rankForm} onSubmit={() => undefined}>
      <Form.Select label={LABEL} name="rank" options={RANKS} placeholder={PLACEHOLDER} />
    </Form.Root>
  );
}

/** By accessible name, which is the label alone — the point of a bound control. */
function trigger() {
  return screen.getByRole('combobox', { name: LABEL });
}

/** Opens the list from the keyboard and lets Radix's deferred focus move settle. */
async function openList() {
  await act(async () => {
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

/** Submits, and waits for the resolver and the handler the click runs asynchronously. */
async function save() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: SAVE }));
  });
}

describe('Form.Select', () => {
  it('renders from `name` and `label` alone, showing the form’s value', () => {
    renderWithProviders(<Probe />);

    expect(trigger()).toHaveTextContent('Novice');
  });

  it('settles the form’s value on a string chosen by keyboard alone', async () => {
    const write = vi.fn((values: { rank: string }) => Promise.resolve(actionSuccess(values)));

    renderWithProviders(<Probe write={write} />);
    await openList();
    fireEvent.keyDown(screen.getByRole('option', { name: 'Adept' }), { key: 'Enter' });
    await save();

    expect(trigger()).toHaveTextContent('Adept');
    expect(write).toHaveBeenCalledWith({ rank: 'adept' });
  });

  it('passes a prop of the control straight through to it', () => {
    renderWithProviders(<Probe className="w-full" />);

    expect(trigger()).toHaveClass('w-full');
  });

  it('lets the call site close the list, though `disabled` lands elsewhere than the rest', () => {
    renderWithProviders(<Probe disabled />);

    expect(trigger()).toBeDisabled();
  });

  it('closes the control when the whole form is closed', () => {
    renderWithProviders(<DisabledFormProbe />);

    expect(trigger()).toBeDisabled();
  });

  it('keeps the message region mounted and silent while the value is accepted', () => {
    renderWithProviders(<Probe />);

    expect(trigger()).toHaveAttribute('aria-invalid', 'false');
    // Present, not merely quiet: a `role="alert"` built at the moment it has
    // something to say is never spoken (`accessibility.md`).
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    expectNothingAnnounced();
  });

  it('marks the control invalid and describes it in the catalog’s words when refused', async () => {
    renderWithProviders(<Probe rank="" />);
    await save();

    expect(trigger()).toHaveTextContent(PLACEHOLDER);
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    // The rule that refused it, in the Theme's words — not the resolver's.
    expect(announced()).toHaveTextContent(validationCopy.required);
    expect(trigger()).toHaveAccessibleDescription(validationCopy.required);
  });

  it('surfaces a refusal the server pinned on the field beside the control', async () => {
    renderWithProviders(
      <Probe
        write={() =>
          Promise.resolve(
            actionFailure(ACTION_ERROR.INVALID_INPUT, {
              rank: ['taken'],
            }),
          )
        }
      />,
    );
    await save();

    expect(announced()).toHaveTextContent(errorCopy.invalidInput);
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAccessibleDescription(errorCopy.invalidInput);
  });
});
