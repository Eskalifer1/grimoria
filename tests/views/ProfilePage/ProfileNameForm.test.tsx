import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateName } from '@/api/user/updateName';
import { ACTION_ERROR } from '@/constants/action';
import { actionFailure, actionSuccess } from '@/shared/lib/actionResult';
import { ProfileNameForm } from '@/views/ProfilePage/ProfileNameForm';

import { messages, renderWithProviders } from '../../setup/render';

vi.mock('@/api/user/updateName', () => ({ updateName: vi.fn() }));

const copy = messages.profilePage;
const errorCopy = messages.actionError;

function typeNameAndSave(next: string) {
  fireEvent.change(screen.getByLabelText(copy.nameLabel), { target: { value: next } });
  fireEvent.click(screen.getByRole('button', { name: copy.save }));
}

describe('ProfileNameForm', () => {
  beforeEach(() => {
    vi.mocked(updateName).mockReset();
  });

  it('shows the new name before the action resolves', async () => {
    let resolveAction = (): void => {};
    vi.mocked(updateName).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = () => resolve(actionSuccess({ name: 'Morgan' }));
      }),
    );

    renderWithProviders(<ProfileNameForm name="Merlin" />);
    typeNameAndSave('Morgan');

    expect(await screen.findByText('Morgan')).toBeInTheDocument();
    expect(screen.queryByText('Merlin')).not.toBeInTheDocument();

    resolveAction();
    await waitFor(() => expect(screen.getByText('Morgan')).toBeInTheDocument());
  });

  it('shows the name the server confirmed, not the one that was typed', async () => {
    // The server normalizes, so the two differ — with them equal the test cannot tell
    // a settled success from a pending frame that never settled.
    vi.mocked(updateName).mockResolvedValue(actionSuccess({ name: 'Morgan of Avalon' }));

    renderWithProviders(<ProfileNameForm name="Merlin" />);
    typeNameAndSave('Morgan');

    expect(await screen.findByText('Morgan of Avalon')).toBeInTheDocument();
    expect(vi.mocked(updateName)).toHaveBeenCalledWith({ name: 'Morgan' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rolls back to the old name and shows the error when the action fails', async () => {
    vi.mocked(updateName).mockResolvedValue(actionFailure(ACTION_ERROR.INVALID_INPUT));

    renderWithProviders(<ProfileNameForm name="Merlin" />);
    typeNameAndSave('Morgan');

    // The alert renders only once the call has settled, so this waits past the
    // optimistic frame rather than passing on it.
    expect(await screen.findByRole('alert')).toHaveTextContent(errorCopy.invalidInput);
    expect(screen.getByText('Merlin')).toBeInTheDocument();
    expect(screen.queryByText('Morgan')).not.toBeInTheDocument();
  });

  it('marks the field invalid only when the input is what was rejected', async () => {
    vi.mocked(updateName).mockResolvedValue(actionFailure(ACTION_ERROR.UNAUTHENTICATED));

    renderWithProviders(<ProfileNameForm name="Merlin" />);
    typeNameAndSave('Morgan');

    await screen.findByRole('alert');
    expect(screen.getByLabelText(copy.nameLabel)).toHaveAttribute('aria-invalid', 'false');
  });

  it('dismisses the error', async () => {
    vi.mocked(updateName).mockResolvedValue(actionFailure(ACTION_ERROR.UNAUTHENTICATED));

    renderWithProviders(<ProfileNameForm name="Merlin" />);
    typeNameAndSave('Morgan');

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: copy.dismiss }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
