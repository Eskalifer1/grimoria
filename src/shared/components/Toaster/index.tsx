'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Toaster as SonnerToaster } from 'sonner';

import { TOAST_POSITION, TOAST_VISIBLE_LIMIT } from '@/constants/toast';

/**
 * The app's one transient surface, mounted once in the frontend layout and raised
 * from `runAction` alone. Colors, radius and the glass blur reach it through
 * `src/styles/shadcn-adapter.css`.
 */
function Toaster() {
  const t = useTranslations('toast');

  return (
    <SonnerToaster
      // Pinned: `src/i18n/resolveTheme.ts` is the only place a Theme is decided,
      // and left to itself the library asks the operating system.
      theme="light"
      position={TOAST_POSITION}
      visibleToasts={TOAST_VISIBLE_LIMIT}
      containerAriaLabel={t('regionLabel')}
      closeButton
      toastOptions={{ closeButtonAriaLabel: t('dismiss') }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
    />
  );
}

export { Toaster };
