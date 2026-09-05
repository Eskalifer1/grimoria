import { act, fireEvent, screen, waitFor } from '@testing-library/react';
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
      <Form.RadioGroup
        className={className}
        disabled={disabled}
        label={LABEL}
        name="rank"
        options={RANKS}
      />
      <Form.Footer />
    </Form.Root>
  );
}

/**
 * A form closed as a whole — `useForm({ disabled: true })`, which the call site's
 * own `disabled` cannot stand in for: the field's is what the group must read
 * first.
 */
function DisabledFormProbe() {
  const rankForm = useForm<{ rank: string }>({ disabled: true, values: { rank: 'novice' } });

  return (
    <Form.Root form={rankForm} onSubmit={() => undefined}>
      <Form.RadioGroup label={LABEL} name="rank" options={RANKS} />
    </Form.Root>
  );
}

/** The group by its accessible name — a `div` no `<label for>` can ever reach. */
function group() {
  return screen.getByRole('radiogroup', { name: LABEL });
}

/** One option, by the label drawn beside it. */
function option(name: string) {
  return screen.getByRole('radio', { name });
}

/** Submits, and waits for the resolver and the handler the click runs asynchronously. */
async function save() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: SAVE }));
  });
}

describe('Form.RadioGroup', () => {
  it('renders from `name` and `label` alone, checking the form’s value', () => {
    renderWithProviders(<Probe />);

    expect(group()).toBeInTheDocument();
    expect(option('Novice')).toBeChecked();
    expect(option('Adept')).not.toBeChecked();
  });

  it('settles the form’s value on a string chosen by keyboard alone', async () => {
    const write = vi.fn((values: { rank: string }) => Promise.resolve(actionSuccess(values)));

    renderWithProviders(<Probe write={write} />);
    // Radix moves roving focus on a timer, and checks the option the move lands on.
    await act(async () => {
      option('Novice').focus();
      fireEvent.keyDown(option('Novice'), { key: 'ArrowDown' });
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });
    await save();

    expect(option('Adept')).toBeChecked();
    expect(write).toHaveBeenCalledWith({ rank: 'adept' });
  });

  it('passes a prop of the control straight through to it', () => {
    renderWithProviders(<Probe className="gap-6" />);

    expect(group()).toHaveClass('gap-6');
  });

  it('lets the call site disable the group, which the field binding writes after', () => {
    renderWithProviders(<Probe disabled />);

    expect(option('Adept')).toBeDisabled();
  });

  it('closes every option when the whole form is closed', () => {
    renderWithProviders(<DisabledFormProbe />);

    expect(option('Novice')).toBeDisabled();
    expect(option('Adept')).toBeDisabled();
  });

  it('names the group without a `for` no group element could answer', () => {
    renderWithProviders(<Probe />);

    // `role="radiogroup"` is a `div`: a `for` pointing at it resolves to nothing
    // and the click lands nowhere, so the group is named by `aria-labelledby`.
    expect(screen.getByText(LABEL).closest('label')).not.toHaveAttribute('for');
    expect(group()).toHaveAccessibleName(LABEL);
  });

  it('checks an option from a click on the label drawn beside it', () => {
    renderWithProviders(<Probe />);
    fireEvent.click(screen.getByText('Adept'));

    expect(option('Adept')).toBeChecked();
  });

  it('keeps the message region mounted and silent while the value is accepted', () => {
    renderWithProviders(<Probe />);

    expect(group()).toHaveAttribute('aria-invalid', 'false');
    // Present, not merely quiet: a `role="alert"` built at the moment it has
    // something to say is never spoken (`accessibility.md`).
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    expectNothingAnnounced();
  });

  it('marks the group invalid and describes it in the catalog’s words when refused', async () => {
    renderWithProviders(<Probe rank="" />);
    await save();

    expect(group()).toHaveAttribute('aria-invalid', 'true');
    // The rule that refused it, in the Theme's words — not the resolver's.
    expect(announced()).toHaveTextContent(validationCopy.required);
    expect(group()).toHaveAccessibleDescription(validationCopy.required);
  });

  it('surfaces a refusal the server pinned on the field beside the group', async () => {
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
    expect(group()).toHaveAttribute('aria-invalid', 'true');
    expect(group()).toHaveAccessibleDescription(errorCopy.invalidInput);
  });

  it('returns focus to the radio the User left off on once the message is dismissed', async () => {
    // The second option, not the first: the field's ref follows the checked
    // radio, and a ref pinned to index 0 would land a keyboard User on the wrong
    // one. With no ref at all, focus falls to the body (WCAG 2.2 AA, 2.4.3).
    //
    // **A ref on the group `div` is not distinguished here**: Radix's roving
    // focus root takes focus and hands it straight to the checked item, so that
    // arrangement lands in the same place — the ref sits on the radio for the
    // arrangements Radix does not rescue, and this test holds the outcome.
    renderWithProviders(
      <Probe
        rank="adept"
        write={() =>
          Promise.resolve(actionFailure(ACTION_ERROR.INVALID_INPUT, { rank: ['taken'] }))
        }
      />,
    );
    await save();
    fireEvent.click(screen.getByRole('button', { name: messages.optimistic.dismiss }));

    await waitFor(() => expect(option('Adept')).toHaveFocus());
    expect(document.body).not.toHaveFocus();
  });
});
