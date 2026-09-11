import type { Metadata } from 'next';

import { ROUTES } from '@/constants/routes';
import { EmptyState } from '@/shared/components/EmptyState';
import { FullPageView } from '@/shared/components/FullPageView';
import { Button } from '@/shared/components/ui/button';
import { STANDARD_FONT_VARIABLES } from '@/shared/config/fonts';

import './(frontend)/globals.css';

// Only a path the proxy never rewrote lands here — one with a dot in it, which
// the matcher skips as a file. No Theme and no locale exist for it, so the copy
// is hoisted English, as in `global-error.tsx`.
const TITLE = 'Page not found';
const DESCRIPTION = 'There is nothing at this address. It may have moved, or never existed.';
const BACK_HOME = 'Back to home';

/**
 * The 404 for a URL outside the localized tree. Everything the proxy rewrites
 * reaches the Themed `[locale]/not-found.tsx` instead (ADR-0016); this file
 * replaces Next's default screen for what is left.
 */
function GlobalNotFound() {
  return (
    <html lang="en" className={STANDARD_FONT_VARIABLES}>
      <body>
        <FullPageView>
          <EmptyState
            heading="h1"
            title={TITLE}
            description={DESCRIPTION}
            action={
              // A plain anchor: this document has its own root, and a soft
              // navigation from it keeps this tree while the URL moves on.
              <Button asChild variant="outline">
                <a href={ROUTES.HOME}>{BACK_HOME}</a>
              </Button>
            }
          />
        </FullPageView>
      </body>
    </html>
  );
}

const metadata: Metadata = { title: TITLE };

export { metadata };
export default GlobalNotFound;
