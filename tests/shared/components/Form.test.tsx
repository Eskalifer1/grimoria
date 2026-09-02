import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ACTION_ERROR } from '@/constants/action';
import { REQUIRED_MARK } from '@/constants/form';
import { VALIDATION_ERROR } from '@/constants/validation';
import { Form } from '@/shared/components/Form';
import { Input } from '@/shared/components/ui/input';
import { useActionForm } from '@/shared/hooks/form/useActionForm';
import type { FormResult } from '@/shared/hooks/form/useFormSeam';
import { useOptimisticForm } from '@/shared/hooks/form/useOptimisticForm';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/lib/actionResult';
import { type FormStatus, IDLE_FORM_STATUS } from '@/shared/lib/formStatus';
import { validationMessage } from '@/shared/lib/validationMessage';

import darkFantasy from '../../../messages/en/dark-fantasy.json';
import {
  announced,
  expectNothingAnnounced,
  messages,
  renderWithProviders,
} from '../../setup/render';

const errorCopy = messages.actionError;
const validationCopy = messages.validation;
const LABEL = 'Name';
const HINT = 'Up to twelve characters.';
/** The default `Form.Submit` draws, so no test spells a label it never passed. */
const SAVE = messages.form.save;
const MAX = 12;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, validationMessage(VALIDATION_ERROR.REQUIRED))
    .max(MAX, validationMessage(VALIDATION_ERROR.TOO_LONG, MAX)),
});

/** Two rules one value breaks at once, for the case where the field must pick one. */
const twoRuleSchema = z.object({
  name: z
    .string()
    .trim()
    .max(MAX, validationMessage(VALIDATION_ERROR.TOO_LONG, MAX))
    .regex(/^\d+$/, validationMessage(VALIDATION_ERROR.REQUIRED)),
});

interface ProbeProps {
  /** What the server has said, when something else owns the write. Omitted — pattern C. */
  writeStatus?: FormStatus;

  /** Stands in for the write the form runs. */
  write?: (values: { name: string }) => Promise<ActionResult<{ name: string }, string>>;

  /** The rule under the label, for the case where the control describes two things. */
  description?: string;

  /** Keeps the rule out of the drawn field, leaving it to the accessible description. */
  isDescriptionHidden?: boolean;

  /** Draws the required mark and sets `aria-required`. */
  required?: boolean;

  /** Draws the reset button beside submit. */
  isResettable?: boolean;

  /** The contract the resolver checks against. Defaults to the one-rule schema. */
  schema?: typeof schema;

  onCancel?: () => void;
}

/** A one-field form built exactly the way a screen builds one. */
function Probe({ writeStatus, ...rest }: ProbeProps) {
  // The pattern is a call site's decision, so each is its own component: a form
  // a store owns never runs the blocking hook, and neither runs both.
  return writeStatus ? (
    <OptimisticProbe writeStatus={writeStatus} {...rest} />
  ) : (
    <BlockingProbe {...rest} />
  );
}

function BlockingProbe({ write, schema: contract = schema, ...rest }: ProbeProps) {
  const nameForm = useActionForm({
    schema: contract,
    values: { name: 'Morgan' },
    write: write ?? ((values) => Promise.resolve(actionSuccess(values))),
  });

  return <ProbeForm {...nameForm} {...rest} />;
}

function OptimisticProbe({
  writeStatus,
  write,
  schema: contract = schema,
  ...rest
}: ProbeProps & { writeStatus: FormStatus }) {
  const nameForm = useOptimisticForm({
    schema: contract,
    values: { name: 'Morgan' },
    writeStatus,
    write: write ?? ((values) => Promise.resolve(actionSuccess(values))),
  });

  return <ProbeForm {...nameForm} {...rest} />;
}

function ProbeForm({
  description,
  isDescriptionHidden,
  required,
  isResettable,
  onCancel,
  ...form
}: Pick<
  ProbeProps,
  'description' | 'isDescriptionHidden' | 'required' | 'isResettable' | 'onCancel'
> &
  FormResult<{ name: string }>) {
  return (
    <Form.Root {...form}>
      <Form.Field
        description={description}
        isDescriptionHidden={isDescriptionHidden}
        label={LABEL}
        name="name"
        render={({ field }) => <Input {...field} />}
        required={required}
      />
      {isResettable ? <Form.Reset /> : null}
      <Form.Footer onCancel={onCancel} />
    </Form.Root>
  );
}

/** A pattern B status, spelled only where it differs from an untouched one. */
function writeStatus(status: Partial<FormStatus>): FormStatus {
  return { ...IDLE_FORM_STATUS, ...status };
}

/** By accessible name: a required field's `*` sits inside the label, `aria-hidden`. */
function nameInput() {
  return screen.getByRole('textbox', { name: LABEL });
}

function saveButton() {
  return screen.getByRole('button', { name: SAVE });
}

/** Submits, and waits for the resolver and the handler the click runs asynchronously. */
async function save() {
  await act(async () => {
    fireEvent.click(saveButton());
  });
}

describe('Form', () => {
  it('publishes the form on context, so a field is handed no control prop', () => {
    renderWithProviders(<Probe />);

    // `Form.Field` reaches `control` through `useFormContext`; without the
    // provider it throws rather than rendering.
    expect(nameInput()).toHaveValue('Morgan');
  });

  it('names the control from its label', () => {
    renderWithProviders(<Probe />);

    expect(nameInput()).toHaveAttribute('id', screen.getByText(LABEL).getAttribute('for'));
  });

  it('runs the write with the parsed values', async () => {
    const write = vi.fn((values: { name: string }) => Promise.resolve(actionSuccess(values)));

    renderWithProviders(<Probe write={write} />);
    await save();

    expect(write).toHaveBeenCalledWith({ name: 'Morgan' });
  });

  it('describes the control by its rule, and by its message once there is one', async () => {
    const rule = 'Twelve characters at most';

    renderWithProviders(<Probe description={rule} />);

    // A description drawn beside a control and attached to nothing is text a
    // screen-reader User never hears (WCAG 2.2 AA, 1.3.1).
    expect(nameInput()).toHaveAccessibleDescription(rule);

    fireEvent.change(nameInput(), { target: { value: '' } });
    await save();

    expect(nameInput()).toHaveAccessibleDescription(`${rule} ${validationCopy.required}`);
  });

  it('keeps the message region mounted and silent while the field is valid', () => {
    renderWithProviders(<Probe />);

    expect(nameInput()).toHaveAttribute('aria-invalid', 'false');
    expect(nameInput()).not.toHaveAttribute('aria-describedby');
    // Present, not merely quiet: a `role="alert"` built at the moment it has
    // something to say is never spoken (`accessibility.md`). Without this line
    // the test passes with the region deleted outright.
    expect(screen.getAllByRole('alert')).not.toHaveLength(0);
    expectNothingAnnounced();
  });

  describe('a failure that belongs to no field', () => {
    it('draws it once, in the footer, and leaves the control valid', () => {
      renderWithProviders(
        <Probe
          writeStatus={writeStatus({ error: actionFailure(ACTION_ERROR.UNAUTHENTICATED).error })}
        />,
      );

      expect(announced()).toHaveTextContent(errorCopy.unauthenticated);
      // The value is not the field's fault, so the input is not marked as the culprit.
      expect(nameInput()).toHaveAttribute('aria-invalid', 'false');
    });

    it('offers a dismissal only when the write says one is allowed', () => {
      const dismiss = vi.fn();
      const error = actionFailure(ACTION_ERROR.UNAUTHENTICATED).error;

      const { rerender } = renderWithProviders(<Probe writeStatus={writeStatus({ error })} />);

      expect(screen.queryByRole('button', { name: messages.optimistic.dismiss })).toBeNull();

      rerender(<Probe writeStatus={writeStatus({ error, dismiss })} />);
      fireEvent.click(screen.getByRole('button', { name: messages.optimistic.dismiss }));

      expect(dismiss).toHaveBeenCalledOnce();
    });

    it('says nothing when there is nothing to say', () => {
      renderWithProviders(<Probe />);

      expectNothingAnnounced();
    });
  });

  describe('a field that must be filled', () => {
    it('marks it for both Users, and lets neither mark stand alone', () => {
      renderWithProviders(<Probe required />);

      // The glyph is for the eye and `aria-required` for the ear; the glyph is
      // hidden from the name, or the control answers to "Name *".
      expect(nameInput()).toHaveAttribute('aria-required', 'true');
      expect(nameInput()).toHaveAccessibleName(LABEL);
      expect(screen.getByText(REQUIRED_MARK)).toHaveAttribute('aria-hidden', 'true');
    });

    it('leaves a field nothing was said about unmarked', () => {
      renderWithProviders(<Probe />);

      expect(nameInput()).toHaveAttribute('aria-required', 'false');
      expect(screen.queryByText(REQUIRED_MARK)).toBeNull();
    });
  });

  describe('a rule kept off the screen', () => {
    it('still reaches the control’s description', () => {
      renderWithProviders(<Probe description={HINT} isDescriptionHidden />);

      // 3.3.2 is met by the accessible description, not by the drawn text: a
      // bound spelled out under every field is noise to the eye that can read it.
      expect(nameInput()).toHaveAccessibleDescription(HINT);
      expect(screen.getByText(HINT)).toHaveClass('sr-only');
    });

    it('draws it where it was not hidden', () => {
      renderWithProviders(<Probe description={HINT} />);

      expect(screen.getByText(HINT)).not.toHaveClass('sr-only');
    });
  });

  describe('a reset the form offers itself', () => {
    it('drops the draft, the refusal and the write’s failure together', async () => {
      const write = vi.fn().mockResolvedValue(actionFailure(ACTION_ERROR.FORBIDDEN));

      renderWithProviders(<Probe isResettable write={write} />);
      await save();

      expect(announced()).toHaveTextContent(errorCopy.forbidden);

      fireEvent.change(nameInput(), { target: { value: '' } });
      await save();

      // Two reasons stand at once: the resolver refuses the empty value, and the
      // footer still holds the one the write came back with.
      expect(nameInput()).toHaveAccessibleDescription(validationCopy.required);
      expect(screen.getByText(errorCopy.forbidden)).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: messages.form.reset }));
      });

      // `resetOptions` keeps dirty values and errors, because a change to
      // `values` resets the form too; a reset the User asked for turns both back
      // off, or the button clears nothing it says it clears.
      expect(nameInput()).toHaveValue('Morgan');
      expectNothingAnnounced();
    });

    it('goes back to what the write saved, not to where the form started', async () => {
      renderWithProviders(<Probe isResettable />);
      fireEvent.change(nameInput(), { target: { value: 'Casey' } });
      await save();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: messages.form.reset }));
      });

      // Nothing outside a blocking form answers with the value, so what it saved
      // is what it holds — a reset to the seed would undo a landed write.
      expect(nameInput()).toHaveValue('Casey');
    });

    it('goes back to the last value the server accepted, never to one it refused', async () => {
      const write = vi.fn().mockResolvedValue(actionFailure(ACTION_ERROR.CONFLICT));

      renderWithProviders(<Probe isResettable write={write} />);
      fireEvent.change(nameInput(), { target: { value: 'Casey' } });
      await save();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: messages.form.reset }));
      });

      // A refusal is not an answer: adopting the draft as the value to fall back
      // to makes Reset restore the very value the server has just rejected.
      expect(nameInput()).toHaveValue('Morgan');
    });

    it('never submits on its way', () => {
      renderWithProviders(<Probe isResettable />);

      expect(screen.getByRole('button', { name: messages.form.reset })).toHaveAttribute(
        'type',
        'button',
      );
    });
  });

  describe('the submit row', () => {
    it('draws the submit button the footer was given', () => {
      renderWithProviders(<Probe />);

      expect(saveButton()).toHaveAttribute('type', 'submit');
    });

    it('names itself from the shared catalog when the form passed no label', () => {
      renderWithProviders(<Probe />);

      // Most forms save, so the word is the layer's rather than each surface's.
      expect(saveButton()).toHaveAccessibleName(messages.form.save);
    });

    it('draws cancel only when there is somewhere to go back to', () => {
      const onCancel = vi.fn();

      const { rerender } = renderWithProviders(<Probe />);

      expect(screen.queryByRole('button', { name: messages.form.cancel })).toBeNull();

      rerender(<Probe onCancel={onCancel} />);
      fireEvent.click(screen.getByRole('button', { name: messages.form.cancel }));

      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('a field the schema rejected', () => {
    it('names the rule that refused it, never the resolver’s own English', async () => {
      const write = vi.fn();

      renderWithProviders(<Probe write={write} />);
      fireEvent.change(nameInput(), { target: { value: '' } });
      await save();

      expect(announced()).toHaveTextContent(validationCopy.required);
      expect(write).not.toHaveBeenCalled();
    });

    it('names one rule at a time, even where two refuse the same value', async () => {
      // Sixteen `x` breaks `max(12)` and the digits-only rule at once; the
      // resolver reports the first, and the field draws one sentence.
      renderWithProviders(<Probe schema={twoRuleSchema} />);
      fireEvent.change(nameInput(), { target: { value: 'x'.repeat(16) } });
      await save();

      expect(announced()).toHaveTextContent(validationCopy.tooLong.replace('{limit}', `${MAX}`));
      expect(screen.queryByText(validationCopy.required)).toBeNull();
    });

    it('carries the rule’s own bound into the message', async () => {
      renderWithProviders(<Probe />);
      fireEvent.change(nameInput(), { target: { value: 'Morgan of Avalon' } });
      await save();

      expect(announced()).toHaveTextContent(`${MAX}`);
    });

    it('marks the control invalid and points it at the message', async () => {
      renderWithProviders(<Probe />);
      fireEvent.change(nameInput(), { target: { value: '' } });
      await save();

      await waitFor(() => {
        expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
      });

      expect(nameInput()).toHaveAccessibleDescription(validationCopy.required);
    });

    it('is worded per Theme, so neither catalog answers with the other’s sentence', () => {
      expect(Object.keys(darkFantasy.validation)).toEqual(Object.keys(validationCopy));
      expect(darkFantasy.validation.required).not.toBe(validationCopy.required);
    });
  });

  describe('a field the server refused', () => {
    it('draws the failure beside that field only, worded from the shared catalog', () => {
      const refused = actionFailure(ACTION_ERROR.CONFLICT, { name: ['taken'] }).error;

      renderWithProviders(<Probe writeStatus={writeStatus({ fieldErrors: { name: refused } })} />);

      // One region, so the reason is not printed beside the field and in the
      // footer both.
      expect(announced()).toHaveTextContent(errorCopy.conflict);
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput()).toHaveAccessibleDescription(errorCopy.conflict);
    });

    it('loses to the resolver, which is the newer answer', async () => {
      const refused = actionFailure(ACTION_ERROR.CONFLICT, { name: ['taken'] }).error;

      renderWithProviders(<Probe writeStatus={writeStatus({ fieldErrors: { name: refused } })} />);
      fireEvent.change(nameInput(), { target: { value: '' } });
      await save();

      expect(announced()).toHaveTextContent(validationCopy.required);
      expect(screen.queryByText(errorCopy.conflict)).toBeNull();
    });
  });

  describe('a form holding its own write state', () => {
    it('refuses a second submit while the first is out, with its inputs still live', async () => {
      let settle = (): void => {};
      const write = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          settle = () => resolve(undefined);
        }),
      );

      renderWithProviders(<Probe write={write} />);
      saveButton().focus();
      await save();

      expect(saveButton()).toHaveAttribute('aria-disabled', 'true');
      expect(saveButton()).toHaveAttribute('aria-busy', 'true');
      // `disabled` would blur the button and drop a keyboard User to the body for
      // the length of the write, with nothing bringing them back (2.4.3).
      expect(saveButton()).toHaveFocus();
      // The draft is the User's, and a write in flight is no reason to take it away.
      expect(nameInput()).not.toBeDisabled();

      fireEvent.click(saveButton());

      expect(write).toHaveBeenCalledOnce();

      await act(async () => {
        settle();
      });

      expect(saveButton()).toHaveAttribute('aria-disabled', 'false');
    });

    it('refuses the Enter key too, which reaches the form and no button', async () => {
      let settle = (): void => {};
      const write = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          settle = () => resolve(undefined);
        }),
      );

      renderWithProviders(<Probe write={write} />);
      await save();

      // Enter in a field submits the form itself; no button is clicked, so a
      // refusal that lived on the button would never see it.
      await act(async () => {
        fireEvent.submit(nameInput());
      });

      expect(write).toHaveBeenCalledOnce();

      await act(async () => {
        settle();
      });
    });

    it('says something when the write never answers at all', async () => {
      const write = vi.fn().mockRejectedValue(new Error('the network went'));

      renderWithProviders(<Probe write={write} />);
      await save();

      // A Server Action rejects rather than returning a failure; uncaught, the
      // form falls silent and the User is left staring at a live button.
      expect(announced()).toHaveTextContent(errorCopy.unexpected);
    });

    it('holds what the server saved, over anything typed while the write was out', async () => {
      let settle = (): void => {};
      const write = vi.fn().mockReturnValue(
        new Promise<ActionResult<{ name: string }, string>>((resolve) => {
          settle = () => resolve(actionSuccess({ name: 'Casey of Avalon' }));
        }),
      );

      renderWithProviders(<Probe write={write} />);
      fireEvent.change(nameInput(), { target: { value: 'Casey' } });
      await save();
      fireEvent.change(nameInput(), { target: { value: '' } });
      fireEvent.blur(nameInput());

      await waitFor(() => expect(nameInput()).toHaveAccessibleDescription(validationCopy.required));

      await act(async () => {
        settle();
      });

      // The answer is the whole state of the form: the value the server settled
      // on, and no refusal of a draft that no longer exists.
      expect(nameInput()).toHaveValue('Casey of Avalon');
      expect(nameInput()).toHaveAccessibleDescription('');
    });

    it('says something when the write throws before it ever returns a promise', async () => {
      const write = vi.fn().mockImplementation(() => {
        throw new Error('thrown, not rejected');
      });

      renderWithProviders(<Probe write={write} />);
      await save();

      // A throw on the way out never reaches a `.catch` on the promise, and the
      // form would fall silent with the button live again.
      expect(announced()).toHaveTextContent(errorCopy.unexpected);
    });

    it('draws a failure naming a field this form has no input for', async () => {
      const write = vi
        .fn()
        .mockResolvedValue(actionFailure(ACTION_ERROR.INVALID_INPUT, { email: ['taken'] }));

      renderWithProviders(<Probe write={write} />);
      await save();

      // Nothing draws `email`, so dropping the form-level half loses the reason
      // altogether: a form that refuses to save and says why to no one.
      expect(announced()).toHaveTextContent(errorCopy.invalidInput);
    });

    it('draws a failure whose field list came back empty', async () => {
      const write = vi.fn().mockResolvedValue(actionFailure(ACTION_ERROR.INVALID_INPUT, {}));

      renderWithProviders(<Probe write={write} />);
      await save();

      expect(announced()).toHaveTextContent(errorCopy.invalidInput);
    });

    it('keeps the draft when the write comes back refused', async () => {
      const write = vi.fn().mockResolvedValue(actionFailure(ACTION_ERROR.CONFLICT));

      renderWithProviders(<Probe write={write} />);
      fireEvent.change(nameInput(), { target: { value: 'Arthur' } });
      await save();

      // The refusal is about this value, so this value is what the User has to
      // see to correct it. `values` never moved — the write did not land.
      expect(nameInput()).toHaveValue('Arthur');
      expect(announced()).toHaveTextContent(errorCopy.conflict);
    });

    it('refuses a second submit inside the same tick', async () => {
      let settle = (): void => {};
      const write = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          settle = () => resolve(undefined);
        }),
      );

      renderWithProviders(<Probe write={write} />);

      // Held Enter repeats before React has rendered the lock, so a guard read
      // off the last render is no guard at all.
      await act(async () => {
        fireEvent.submit(nameInput());
        fireEvent.submit(nameInput());
      });

      expect(write).toHaveBeenCalledOnce();

      await act(async () => {
        settle();
      });
    });

    it('keeps what was saved when the surface has no newer answer', async () => {
      const write = vi.fn((values: { name: string }) => Promise.resolve(actionSuccess(values)));

      renderWithProviders(<Probe write={write} />);
      fireEvent.change(nameInput(), { target: { value: 'Casey' } });
      await save();

      // `values` never moved — the surface has nothing newer to offer, so the
      // value the User just saved is the value that stays.
      expect(nameInput()).toHaveValue('Casey');
    });

    it('draws the failure the write answered with', async () => {
      const write = vi.fn().mockResolvedValue(actionFailure(ACTION_ERROR.FORBIDDEN));

      renderWithProviders(<Probe write={write} />);
      await save();

      expect(announced()).toHaveTextContent(errorCopy.forbidden);
    });

    it('clears the last reason once a later write lands', async () => {
      const write = vi
        .fn()
        .mockResolvedValueOnce(actionFailure(ACTION_ERROR.FORBIDDEN))
        .mockResolvedValueOnce(actionSuccess({ name: 'Morgan' }));

      renderWithProviders(<Probe write={write} />);
      await save();

      expect(announced()).toHaveTextContent(errorCopy.forbidden);

      await save();

      // A write that answers nothing is a write that succeeded, and a banner
      // still standing over a saved form has no way out but the dismissal.
      expectNothingAnnounced();
    });

    it('puts a failure the write named a field for beside that field', async () => {
      const write = vi
        .fn()
        .mockResolvedValue(actionFailure(ACTION_ERROR.CONFLICT, { name: ['taken'] }));

      renderWithProviders(<Probe write={write} />);
      await save();

      expect(announced()).toHaveTextContent(errorCopy.conflict);
      expect(nameInput()).toHaveAccessibleDescription(errorCopy.conflict);
    });

    it('returns focus to the field once its message is dismissed', async () => {
      const write = vi
        .fn()
        .mockResolvedValue(actionFailure(ACTION_ERROR.CONFLICT, { name: ['taken'] }));

      renderWithProviders(<Probe write={write} />);
      await save();

      fireEvent.click(screen.getByRole('button', { name: messages.optimistic.dismiss }));

      // The field is what the message was about and what the User has to change.
      // Left to the browser, focus falls to the body; sent to the submit button,
      // the next Enter writes again (WCAG 2.2 AA, 2.4.3).
      await waitFor(() => expect(nameInput()).toHaveFocus());
    });
  });

  describe('the reset after a write', () => {
    const TITLE = 'Title';
    const pairSchema = z.object({ name: z.string(), title: z.string() });

    /** Two fields, so a reset that is per form rather than per field shows up. */
    function PairProbe({
      values,
      write,
    }: {
      values: { name: string; title: string };
      write: () => Promise<ActionResult<{ name: string; title: string }, string>>;
    }) {
      // A surface owns the value here — that is what makes `values` moving under
      // the form the thing being tested.
      const pair = useOptimisticForm({
        schema: pairSchema,
        values,
        write,
        writeStatus: IDLE_FORM_STATUS,
      });

      return (
        <Form.Root {...pair}>
          <Form.Field label={LABEL} name="name" render={({ field }) => <Input {...field} />} />
          <Form.Field label={TITLE} name="title" render={({ field }) => <Input {...field} />} />
          <Form.Footer submitLabel={SAVE} />
        </Form.Root>
      );
    }

    it('frees a field that did not move, and leaves one that did alone', async () => {
      let settle = (): void => {};
      const write = vi.fn().mockReturnValue(
        new Promise<ActionResult<{ name: string }, string>>((resolve) => {
          settle = () => resolve(actionSuccess({ name: 'Casey' }));
        }),
      );
      const server = { name: 'Morgan', title: 'Knight' };

      const { rerender } = renderWithProviders(<PairProbe values={server} write={write} />);

      fireEvent.change(nameInput(), { target: { value: 'Arthur' } });
      fireEvent.change(screen.getByLabelText(TITLE), { target: { value: 'Squire' } });
      await save();

      // Only one of the two moves while the write is out.
      fireEvent.change(nameInput(), { target: { value: 'Arthur the Younger' } });

      await act(async () => {
        settle();
      });

      rerender(<PairProbe values={{ name: 'Arthur', title: 'Baron' }} write={write} />);

      await waitFor(() => expect(screen.getByLabelText(TITLE)).toHaveValue('Baron'));
      expect(nameInput()).toHaveValue('Arthur the Younger');
    });
  });
});
