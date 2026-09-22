'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId } from 'react';

import { useTranslations } from 'next-intl';

import { setThemeOptimistic } from '@/api/user/setTheme/optimistic';
import { THEME, THEMES, type Theme } from '@/constants/theme';
import { ErrorRow } from '@/shared/components/ErrorRow';
import { InFlight } from '@/shared/components/InFlight';
import { FieldLabel } from '@/shared/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { useOptimisticValue } from '@/shared/hooks/useOptimisticValue';

/** Each Theme's option key under `themeToggle.option` — camelCase, as `i18n.md` wants, where the value is kebab. */
const OPTION_KEY = {
  [THEME.STANDARD]: 'standard',
  [THEME.DARK_FANTASY]: 'darkFantasy',
} as const satisfies Record<Theme, string>;

interface ThemeToggleProps {
  /** The Theme the server rendered this page in — `resolveTheme()`, read off the route segment. */
  theme: Theme;
}

/**
 * Pattern B with `rollback`: the picked option checks at once, and a failure —
 * the action itself, never the profile write, which lands after the answer —
 * hands it back to the server's Theme with the reason beside it. Once the store
 * settles on a Theme the page was not rendered in — this tab's write, or one
 * adopted from another tab — the route is refreshed, so the proxy rewrites onto
 * the new segment and the copy changes tonality with the colors. The component
 * itself sets no `data-theme`, and a superseded answer refreshes nothing.
 */
function ThemeToggle({ theme }: ThemeToggleProps) {
  const t = useTranslations('themeToggle');
  const router = useRouter();
  const groupId = useId();
  const labelId = useId();
  const messageId = useId();

  const chosen = useOptimisticValue({
    descriptor: setThemeOptimistic,
    input: { theme },
    field: 'theme',
    value: theme,
    onFailure: 'rollback',
  });

  useEffect(() => {
    if (!chosen.isPending && chosen.value !== theme) {
      router.refresh();
    }
  }, [chosen.isPending, chosen.value, theme, router]);

  function handleValueChange(value: string) {
    // Radix answers with a string; only a value from the list is a Theme.
    const next = THEMES.find((candidate) => candidate === value);

    if (next) {
      void chosen.run(next);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-ui text-text-muted" id={labelId}>
        {t('label')}
      </span>
      <InFlight as="div" pendingAction={chosen.pendingAction}>
        <RadioGroup
          aria-describedby={chosen.error ? messageId : undefined}
          aria-labelledby={labelId}
          onValueChange={handleValueChange}
          value={chosen.value}
        >
          {THEMES.map((option, index) => {
            const optionId = `${groupId}-${index}`;

            return (
              <div className="flex items-center gap-3" key={option}>
                <RadioGroupItem id={optionId} value={option} />
                <FieldLabel className="font-normal" htmlFor={optionId}>
                  {t(`option.${OPTION_KEY[option]}`)}
                </FieldLabel>
              </div>
            );
          })}
        </RadioGroup>
      </InFlight>
      <ErrorRow
        errors={chosen.error ? [chosen.error] : []}
        id={messageId}
        onDismiss={chosen.dismiss}
      />
    </div>
  );
}

export type { ThemeToggleProps };
export { ThemeToggle };
