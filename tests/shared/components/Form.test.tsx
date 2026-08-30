import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ACTION_ERROR } from '@/constants/action';
import {
  Form,
  FormControl,
  FormField,
  FormFieldMessage,
  FormItem,
  FormLabel,
} from '@/shared/components/Form';
import { Input } from '@/shared/components/ui/input';
import { clientFailure, type OptimisticFailure } from '@/shared/lib/optimistic/entry';

import {
  announced,
  expectNothingAnnounced,
  messages,
  renderWithProviders,
} from '../../setup/render';

const errorCopy = messages.actionError;
const LABEL = 'Name';
const SAVE = 'Save';

const schema = z.object({ name: z.string().min(1, 'the resolver’s own words') });

interface ProbeProps {
  /** The failure the server named this field for, drawn beside the control. */
  error?: OptimisticFailure | null;

  /** The failure that belongs to the write rather than to a field, drawn by the form. */
  formError?: OptimisticFailure | null;

  onDismiss?: () => void;
  onCancel?: () => void;
  onSubmit?: (values: { name: string }) => void;
}

/** A one-field form built exactly the way a screen builds one. */
function Probe({ error, formError, onDismiss, onCancel, onSubmit }: ProbeProps) {
  const form = useForm({ resolver: zodResolver(schema), values: { name: 'Morgan' } });

  return (
    <Form
      error={formError}
      form={form}
      onCancel={onCancel}
      onDismiss={onDismiss}
      onSubmit={onSubmit ?? (() => {})}
      submitLabel={SAVE}
    >
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{LABEL}</FormLabel>
            <FormControl error={error}>
              <Input {...field} />
            </FormControl>
            <FormFieldMessage error={error} />
          </FormItem>
        )}
      />
    </Form>
  );
}

function nameInput() {
  return screen.getByLabelText(LABEL);
}

describe('Form', () => {
  it('publishes the form on context, so a field is handed no control prop', () => {
    renderWithProviders(<Probe />);

    // `FormField` reaches `control` through `useFormContext`; without the
    // provider it throws rather than rendering.
    expect(nameInput()).toHaveValue('Morgan');
  });

  it('names the control from its label', () => {
    renderWithProviders(<Probe />);

    expect(nameInput()).toHaveAttribute('id', screen.getByText(LABEL).getAttribute('for'));
  });

  it('runs the submit handler with the parsed values', async () => {
    const onSubmit = vi.fn();

    renderWithProviders(<Probe onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: SAVE }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'Morgan' }, expect.anything());
    });
  });

  it('keeps the message region mounted and silent while the field is valid', () => {
    renderWithProviders(<Probe />);

    expect(nameInput()).toHaveAttribute('aria-invalid', 'false');
    expect(nameInput()).not.toHaveAttribute('aria-describedby');
    expectNothingAnnounced();
  });

  describe('a failure that belongs to no field', () => {
    it('draws it once, under the fields and above the submit row', () => {
      renderWithProviders(<Probe formError={clientFailure(ACTION_ERROR.UNAUTHENTICATED)} />);

      // The form owns this message, so a screen passes the reason and writes no
      // error row of its own.
      expect(announced()).toHaveTextContent(errorCopy.unauthenticated);
    });

    it('offers a dismissal only when the screen says one is allowed', () => {
      const onDismiss = vi.fn();

      renderWithProviders(
        <Probe formError={clientFailure(ACTION_ERROR.UNAUTHENTICATED)} onDismiss={onDismiss} />,
      );
      fireEvent.click(screen.getByRole('button', { name: messages.optimistic.dismiss }));

      expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('says nothing when there is nothing to say', () => {
      renderWithProviders(<Probe />);

      expectNothingAnnounced();
    });
  });

  describe('the submit row', () => {
    it('draws the submit button the form was given', () => {
      renderWithProviders(<Probe />);

      expect(screen.getByRole('button', { name: SAVE })).toHaveAttribute('type', 'submit');
    });

    it('draws cancel only when there is somewhere to go back to', () => {
      const onCancel = vi.fn();

      renderWithProviders(<Probe />);

      expect(screen.queryByRole('button', { name: messages.form.cancel })).toBeNull();

      renderWithProviders(<Probe onCancel={onCancel} />);
      fireEvent.click(screen.getByRole('button', { name: messages.form.cancel }));

      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('a field the schema rejected', () => {
    it('words the refusal from the shared catalog, never from the resolver', async () => {
      const onSubmit = vi.fn();

      renderWithProviders(<Probe onSubmit={onSubmit} />);
      fireEvent.change(nameInput(), { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: SAVE }));

      // The resolver's message is the schema author's English, and belongs in a
      // log rather than beside an input in either Theme.
      expect(await screen.findByText(errorCopy.invalidInput)).toBeInTheDocument();
      expect(screen.queryByText(/resolver/)).not.toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('marks the control invalid and points it at the message', async () => {
      renderWithProviders(<Probe />);
      fireEvent.change(nameInput(), { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: SAVE }));

      await waitFor(() => {
        expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
      });

      expect(nameInput()).toHaveAttribute('aria-describedby', announced().id);
    });
  });

  describe('a field the server refused', () => {
    it('draws the failure the store holds, worded from the same catalog', () => {
      renderWithProviders(<Probe error={clientFailure(ACTION_ERROR.CONFLICT)} />);

      expect(announced()).toHaveTextContent(errorCopy.conflict);
    });

    it('marks the control invalid, which the vendored primitive alone would not', () => {
      renderWithProviders(<Probe error={clientFailure(ACTION_ERROR.CONFLICT)} />);

      // The schema is happy and react-hook-form has no error; a control drawn
      // valid with a failure under it is the one state that must not happen.
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput()).toHaveAttribute('aria-describedby', announced().id);
    });
  });
});
