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
const LABEL = 'Email digest';
const SAVE = messages.form.save;

const schema = z.object({
  digest: z.boolean().refine((on) => on, validationMessage(VALIDATION_ERROR.REQUIRED)),
});

interface ProbeProps {
  /** Stands in for the write the form runs. */
  write?: (values: { digest: boolean }) => Promise<ActionResult<{ digest: boolean }, string>>;

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
  const digestForm = useActionForm({
    schema,
    values: { digest: false },
    write: write ?? ((values) => Promise.resolve(actionSuccess(values))),
  });

  return (
    <Form.Root {...digestForm}>
      <Form.Switch
        disabled={disabled}
        isLabelFirst={isLabelFirst}
        label={LABEL}
        name="digest"
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
  const digestForm = useForm<{ digest: boolean }>({ disabled: true, values: { digest: false } });

  return (
    <Form.Root form={digestForm} onSubmit={() => undefined}>
      <Form.Switch label={LABEL} name="digest" />
    </Form.Root>
  );
}

/** By accessible name, which is the label alone — the point of a bound control. */
function digestSwitch() {
  return screen.getByRole('switch', { name: LABEL });
}

/** Submits, and waits for the resolver and the handler the click runs asynchronously. */
async function save() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: SAVE }));
  });
}

describe('Form.Switch', () => {
  it('renders from `name` and `label` alone, holding the form’s value', () => {
    renderWithProviders(<Probe />);

    expect(digestSwitch()).not.toBeChecked();
  });

  it('moves the form’s value as a boolean when the User toggles it', async () => {
    const write = vi.fn((values: { digest: boolean }) => Promise.resolve(actionSuccess(values)));

    renderWithProviders(<Probe write={write} />);
    fireEvent.click(digestSwitch());
    await save();

    expect(digestSwitch()).toBeChecked();
    // `true`, not `"on"` — the adapter answers in the type the schema parses.
    expect(write).toHaveBeenCalledWith({ digest: true });
  });

  it('passes a native prop of the control straight through to it', () => {
    renderWithProviders(<Probe title="Weekly summary" />);

    expect(digestSwitch()).toHaveAttribute('title', 'Weekly summary');
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

    expect(digestSwitch()).toBeDisabled();
  });

  it('closes the control when the whole form is closed', () => {
    renderWithProviders(<DisabledFormProbe />);

    expect(digestSwitch()).toBeDisabled();
  });

  it('toggles from a click on its drawn label', () => {
    renderWithProviders(<Probe />);
    fireEvent.click(screen.getByText(LABEL));

    expect(digestSwitch()).toBeChecked();
  });

  it('stays a focusable button in the tab order', () => {
    renderWithProviders(<Probe />);

    // The tab order, read as a number: `tabindex="-2"` is as removed as `"-1"`.
    // **Space is not asserted here** — jsdom synthesizes no click from a keypress
    // and the repo ships no `@testing-library/user-event`, so that the platform
    // activates this button from the keyboard is e2e's (#39). What is held here
    // is that the button is reachable at all.
    expect(digestSwitch().tagName).toBe('BUTTON');
    expect(digestSwitch().tabIndex).toBeGreaterThanOrEqual(0);
    digestSwitch().focus();
    expect(digestSwitch()).toHaveFocus();
  });

  it('keeps the message region mounted and silent while the value is accepted', () => {
    renderWithProviders(<Probe />);

    expect(digestSwitch()).toHaveAttribute('aria-invalid', 'false');
    // Present, not merely quiet: a `role="alert"` built at the moment it has
    // something to say is never spoken (`accessibility.md`).
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    expectNothingAnnounced();
  });

  it('marks the control invalid and describes it in the catalog’s words when refused', async () => {
    renderWithProviders(<Probe />);
    await save();

    expect(digestSwitch()).toHaveAttribute('aria-invalid', 'true');
    // The rule that refused it, in the Theme's words — not the resolver's.
    expect(announced()).toHaveTextContent(validationCopy.required);
    expect(digestSwitch()).toHaveAccessibleDescription(validationCopy.required);
  });

  it('surfaces a refusal the server pinned on the field beside the control', async () => {
    renderWithProviders(
      <Probe
        write={() =>
          Promise.resolve(
            actionFailure(ACTION_ERROR.INVALID_INPUT, {
              digest: ['unavailable'],
            }),
          )
        }
      />,
    );
    fireEvent.click(digestSwitch());
    await save();

    expect(announced()).toHaveTextContent(errorCopy.invalidInput);
    expect(digestSwitch()).toHaveAttribute('aria-invalid', 'true');
    expect(digestSwitch()).toHaveAccessibleDescription(errorCopy.invalidInput);
  });
});
