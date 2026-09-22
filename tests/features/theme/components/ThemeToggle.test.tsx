import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setTheme } from '@/api/user/setTheme';
import { ACTION_ERROR } from '@/constants/action';
import { THEME, THEMES } from '@/constants/theme';
import { ThemeToggle } from '@/features/theme/components/ThemeToggle';
import { actionFailure, actionSuccess } from '@/shared/lib/actionResult';
import { optimisticStore } from '@/shared/lib/optimistic/store';

import {
  expectNothingAnnounced,
  findAnnounced,
  messages,
  renderWithProviders,
} from '../../../setup/render';

vi.mock('@/api/user/setTheme', () => ({ setTheme: vi.fn() }));

const refresh = vi.fn();

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh }),
}));

const copy = messages.themeToggle;
const errorCopy = messages.actionError;

/** The option by its accessible name, which is the label beside the radio. */
function option(theme: (typeof THEMES)[number]): HTMLElement {
  const name = theme === THEME.DARK_FANTASY ? copy.option.darkFantasy : copy.option.standard;

  return screen.getByRole('radio', { name });
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    optimisticStore.clearAll();
    refresh.mockReset();
    vi.mocked(setTheme).mockReset();
    vi.mocked(setTheme).mockResolvedValue(actionSuccess({ theme: THEME.DARK_FANTASY }));
  });

  it('offers one option per Theme, checked from the prop', () => {
    const { rerender } = renderWithProviders(<ThemeToggle theme={THEME.STANDARD} />);

    expect(screen.getByRole('radiogroup', { name: copy.label })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(THEMES.length);
    expect(option(THEME.STANDARD)).toBeChecked();
    expect(option(THEME.DARK_FANTASY)).not.toBeChecked();

    // The server owns the value: a new render with the other Theme is followed.
    rerender(<ThemeToggle theme={THEME.DARK_FANTASY} />);

    expect(option(THEME.DARK_FANTASY)).toBeChecked();
  });

  it('checks the picked option at once, then refreshes once the server agrees', async () => {
    let settle = (): void => {};
    vi.mocked(setTheme).mockReturnValue(
      new Promise((resolve) => {
        settle = () => resolve(actionSuccess({ theme: THEME.DARK_FANTASY }));
      }),
    );

    renderWithProviders(<ThemeToggle theme={THEME.STANDARD} />);

    await act(async () => {
      fireEvent.click(option(THEME.DARK_FANTASY));
    });

    expect(option(THEME.DARK_FANTASY)).toBeChecked();
    expect(vi.mocked(setTheme)).toHaveBeenCalledWith({ theme: THEME.DARK_FANTASY });
    // The segment the page sits on is the old Theme's until the server has the
    // cookie, so the refresh waits for the answer rather than the click.
    expect(refresh).not.toHaveBeenCalled();

    await act(async () => {
      settle();
    });

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expectNothingAnnounced();
  });

  it('steps back to the server Theme on failure and says why, without refreshing', async () => {
    vi.mocked(setTheme).mockResolvedValue(actionFailure(ACTION_ERROR.UNEXPECTED));

    renderWithProviders(<ThemeToggle theme={THEME.STANDARD} />);

    await act(async () => {
      fireEvent.click(option(THEME.DARK_FANTASY));
    });

    expect(await findAnnounced()).toHaveTextContent(errorCopy.unexpected);
    // A radio has nowhere to hold a value the server refused, so the message
    // would otherwise explain a state the User can see is not true.
    await waitFor(() => expect(option(THEME.STANDARD)).toBeChecked());
    expect(option(THEME.DARK_FANTASY)).not.toBeChecked();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('lets the reason be dismissed', async () => {
    vi.mocked(setTheme).mockResolvedValue(actionFailure(ACTION_ERROR.UNAUTHENTICATED));

    renderWithProviders(<ThemeToggle theme={THEME.STANDARD} />);

    await act(async () => {
      fireEvent.click(option(THEME.DARK_FANTASY));
    });
    await findAnnounced();

    fireEvent.click(screen.getByRole('button', { name: messages.optimistic.dismiss }));

    await waitFor(() => expectNothingAnnounced());
    expect(option(THEME.STANDARD)).toBeChecked();
  });
});
