import { expect, type Page, test } from '@playwright/test';

import darkFantasy from '../messages/en/dark-fantasy.json' with { type: 'json' };
import standard from '../messages/en/standard.json' with { type: 'json' };
import { DEFAULT_THEME, THEME, THEME_COLOR, THEMES, type Theme } from '../src/constants/theme';

/** The catalog each Theme words the page in — data, the one import of `messages/` this runner makes. */
const CATALOG: Record<Theme, typeof standard> = {
  [THEME.STANDARD]: standard,
  [THEME.DARK_FANTASY]: darkFantasy,
};

/** Each Theme's key under `themeToggle.option` — the catalog is camelCase where the value is kebab. */
const OPTION_KEY = {
  [THEME.STANDARD]: 'standard',
  [THEME.DARK_FANTASY]: 'darkFantasy',
} as const satisfies Record<Theme, keyof typeof standard.themeToggle.option>;

/** `getComputedStyle` answers a hex token as `rgb(r, g, b)`. */
function toRgb(hex: string): string {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));

  return `rgb(${channels.join(', ')})`;
}

/** The label the toggle shows for `option` while the page is worded in `current`. */
function optionLabel(current: Theme, option: Theme): string {
  return CATALOG[current].themeToggle.option[OPTION_KEY[option]];
}

async function expectTheme(page: Page, theme: Theme): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('body')).toHaveCSS('background-color', toRgb(THEME_COLOR[theme]));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(CATALOG[theme].homePage.title);
  await expect(page.getByRole('radio', { name: optionLabel(theme, theme) })).toBeChecked();
}

test('a Guest switches Theme and the copy, tokens and control move together', async ({ page }) => {
  await page.goto('/');
  await expectTheme(page, DEFAULT_THEME);

  for (const theme of THEMES.filter((candidate) => candidate !== DEFAULT_THEME)) {
    await page.getByRole('radio', { name: optionLabel(DEFAULT_THEME, theme) }).check();
    await expectTheme(page, theme);

    await page.reload();
    await expectTheme(page, theme);

    await page.getByRole('radio', { name: optionLabel(theme, DEFAULT_THEME) }).check();
    await expectTheme(page, DEFAULT_THEME);

    await page.reload();
    await expectTheme(page, DEFAULT_THEME);
  }
});
