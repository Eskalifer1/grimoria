import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateName } from '@/api/user/updateName';
import { ACTION_ERROR } from '@/constants/action';
import { OPTIMISTIC_STORAGE_KEY } from '@/constants/optimistic';
import { actionFailure, actionSuccess } from '@/shared/lib/actionResult';
import { serializeEntries } from '@/shared/lib/optimistic/persistence';
import { optimisticStore } from '@/shared/lib/optimistic/store';
import { ProfileNameForm } from '@/views/ProfilePage/ProfileNameForm';

import {
  announced,
  expectNothingAnnounced,
  findAnnounced,
  messages,
  renderWithProviders,
} from '../../setup/render';

vi.mock('@/api/user/updateName', () => ({ updateName: vi.fn() }));

const copy = messages.profilePage;
const errorCopy = messages.actionError;

const USER = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Merlin',
  updatedAt: '2026-08-25T10:00:00.000Z',
};

/** The form as the profile page mounts it, so no test spells the props out. */
function renderForm() {
  return renderWithProviders(<ProfileNameForm {...USER} />);
}

function nameInput(): HTMLInputElement {
  const input = screen.getByLabelText(copy.nameLabel);

  if (!(input instanceof HTMLInputElement)) {
    throw new Error('the name field is not an input');
  }

  return input;
}

/**
 * Types a name and submits. The click itself is awaited — react-hook-form runs
 * validation and the handler asynchronously — rather than followed by a guess at
 * what the submit will put on screen, which is a shape that goes green early.
 */
async function typeNameAndSave(next: string) {
  fireEvent.change(nameInput(), { target: { value: next } });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: copy.save }));
  });
}

/** What another tab left in the slot, announced the way the browser announces it. */
function otherTabWrote(raw: string) {
  window.localStorage.setItem(OPTIMISTIC_STORAGE_KEY, raw);
  window.dispatchEvent(new StorageEvent('storage', { key: OPTIMISTIC_STORAGE_KEY }));
}

/** A settled answer from the server, dated after the version the form rendered from. */
function saved(name: string) {
  return actionSuccess({ name, updatedAt: '2026-08-25T11:00:00.000Z' });
}

describe('ProfileNameForm', () => {
  beforeEach(() => {
    optimisticStore.clearAll();
    vi.mocked(updateName).mockReset();
    vi.mocked(updateName).mockResolvedValue(saved('Morgan'));
  });

  it('leaves every control live while the write is in flight', async () => {
    let settle = (): void => {};
    vi.mocked(updateName).mockReturnValue(
      new Promise((resolve) => {
        settle = () => resolve(saved('Morgan'));
      }),
    );

    renderForm();
    await typeNameAndSave('Morgan');

    // The premise of pattern B: the User has already moved on, so nothing waits.
    for (const control of screen.getAllByRole('button')) {
      expect(control).not.toBeDisabled();
    }

    expect(nameInput()).not.toBeDisabled();
    expect(await screen.findByText('Morgan')).toBeInTheDocument();

    await act(async () => {
      settle();
    });
  });

  it('shows the typed name before the action resolves', async () => {
    let settle = (): void => {};
    vi.mocked(updateName).mockReturnValue(
      new Promise((resolve) => {
        settle = () => resolve(saved('Morgan'));
      }),
    );

    renderForm();
    await typeNameAndSave('Morgan');

    expect(screen.queryByText('Merlin')).not.toBeInTheDocument();
    // The descriptor's input carries the id the key is built from; the action's
    // schema strips it, so no caller gains an id parameter by writing one here.
    expect(vi.mocked(updateName)).toHaveBeenCalledWith({ id: USER.id, name: 'Morgan' });

    await act(async () => {
      settle();
    });
  });

  it('ends on the name the server returned, not the one that was typed', async () => {
    // The server normalizes, so the two differ — with them equal the test cannot
    // tell a settled success from a pending frame that never settled.
    vi.mocked(updateName).mockResolvedValue(saved('Morgan of Avalon'));

    renderForm();
    await typeNameAndSave('Morgan');

    expect(await screen.findByText('Morgan of Avalon')).toBeInTheDocument();
    expectNothingAnnounced();
    // The half the User edits is the half that matters: left holding the typed
    // name, the next save silently reverts what the server normalized.
    expect(nameInput()).toHaveValue('Morgan of Avalon');
  });

  it('refuses an empty name from the shared schema, without calling the action', async () => {
    renderForm();
    await typeNameAndSave('');

    expect(await findAnnounced()).toHaveTextContent(errorCopy.invalidInput);
    expect(vi.mocked(updateName)).not.toHaveBeenCalled();
  });

  it('puts a failure that names the field beside the input', async () => {
    vi.mocked(updateName).mockResolvedValue(
      actionFailure(ACTION_ERROR.INVALID_INPUT, { name: ['too long'] }),
    );

    renderForm();
    await typeNameAndSave('Morgan');

    const message = await findAnnounced();

    expect(message).toHaveTextContent(errorCopy.invalidInput);
    expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput()).toHaveAttribute('aria-describedby', message.id);
  });

  it('puts a failure that names no field under the form, dismissible', async () => {
    vi.mocked(updateName).mockResolvedValue(actionFailure(ACTION_ERROR.UNAUTHENTICATED));

    renderForm();
    await typeNameAndSave('Morgan');

    expect(await findAnnounced()).toHaveTextContent(errorCopy.unauthenticated);
    // The value is not the field's fault, so the input is not marked as the culprit.
    expect(nameInput()).toHaveAttribute('aria-invalid', 'false');

    fireEvent.click(screen.getByRole('button', { name: messages.optimistic.dismiss }));

    await waitFor(() => expectNothingAnnounced());
    // Dismissing throws the attempt away, so the server's name is what is left.
    expect(screen.getByText('Merlin')).toBeInTheDocument();
  });

  it('restores the optimistic value after unmounting mid-flight', async () => {
    let settle = (): void => {};
    vi.mocked(updateName).mockReturnValue(
      new Promise((resolve) => {
        settle = () => resolve(saved('Morgan'));
      }),
    );

    const first = renderForm();
    await typeNameAndSave('Morgan');
    first.unmount();

    renderForm();

    expect(await screen.findByText('Morgan')).toBeInTheDocument();
    expect(nameInput()).toHaveValue('Morgan');

    await act(async () => {
      settle();
    });
  });

  it('keeps the typed value and the reason across a remount after a failure', async () => {
    vi.mocked(updateName).mockResolvedValue(actionFailure(ACTION_ERROR.UNEXPECTED));

    const first = renderForm();
    await typeNameAndSave('Morgan');
    await findAnnounced();
    first.unmount();

    renderForm();

    // What the store persists is what a reload would rebuild the form from.
    expect(await screen.findByText('Morgan')).toBeInTheDocument();
    expect(nameInput()).toHaveValue('Morgan');
    expect(announced()).toHaveTextContent(errorCopy.unexpected);
  });

  it('ends on the last submit, and the earlier answer changes nothing', async () => {
    let settleFirst = (): void => {};
    vi.mocked(updateName)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          settleFirst = () => resolve(saved('Morgan'));
        }),
      )
      .mockResolvedValue(saved('Arthur'));

    renderForm();
    await typeNameAndSave('Morgan');
    await typeNameAndSave('Arthur');

    await act(async () => {
      settleFirst();
    });

    expect(await screen.findByText('Arthur')).toBeInTheDocument();
    expect(screen.queryByText('Morgan')).not.toBeInTheDocument();
  });
  it('returns the input to the server name when the attempt is dismissed', async () => {
    vi.mocked(updateName).mockResolvedValue(actionFailure(ACTION_ERROR.UNAUTHENTICATED));

    renderForm();
    await typeNameAndSave('Morgan');
    await findAnnounced();

    fireEvent.click(screen.getByRole('button', { name: messages.optimistic.dismiss }));

    // A discarded attempt that stays in the field comes back on the next save.
    await waitFor(() => expect(nameInput()).toHaveValue('Merlin'));
  });

  it('follows a dismissal made in another tab', async () => {
    vi.mocked(updateName).mockResolvedValue(actionFailure(ACTION_ERROR.UNEXPECTED));

    renderForm();
    await typeNameAndSave('Morgan');
    await findAnnounced();

    await act(async () => {
      otherTabWrote(serializeEntries({}));
    });

    expectNothingAnnounced();
    expect(screen.getByText('Merlin')).toBeInTheDocument();
    expect(nameInput()).toHaveValue('Merlin');
  });
});
