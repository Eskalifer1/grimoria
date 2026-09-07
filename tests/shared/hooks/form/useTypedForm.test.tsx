import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { useOptimisticForm } from '@/shared/hooks/form/useOptimisticForm';
import { type FormStatus, IDLE_FORM_STATUS } from '@/shared/lib/formStatus';

import { renderWithProviders } from '../../../setup/render';

const LABEL = 'Name';

const schema = z.object({ name: z.string() });

interface ProbeProps {
  /** What the server has said. Moved by the test, which is the whole point. */
  writeStatus: FormStatus;
}

/** A form drawn through the namespace the hook hands back, rather than the barrel's. */
function Probe({ writeStatus }: ProbeProps) {
  const { Form } = useOptimisticForm({
    schema,
    values: { name: 'Morgan' },
    writeStatus,
    write: (values) => Promise.resolve({ status: 'success', data: values, error: null } as const),
  });

  return (
    <Form.Root>
      <Form.Input label={LABEL} name="name" />
    </Form.Root>
  );
}

describe('the form the hook hands back', () => {
  it('keeps focus and the draft when the write status moves', () => {
    const { rerender } = renderWithProviders(<Probe writeStatus={IDLE_FORM_STATUS} />);

    const input = screen.getByRole('textbox', { name: LABEL });

    input.focus();
    fireEvent.change(input, { target: { value: 'Merlin' } });

    rerender(<Probe writeStatus={{ ...IDLE_FORM_STATUS, isPending: true }} />);

    // A `Root` rebuilt per render is a new component type, and React unmounts the
    // whole form under it: focus lands on the body and the draft is gone.
    expect(screen.getByRole('textbox', { name: LABEL })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: LABEL })).toHaveValue('Merlin');
  });
});
