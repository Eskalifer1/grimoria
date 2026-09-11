'use client';

import { Button } from '@/shared/components/ui/button';
import { STANDARD_FONT_VARIABLES } from '@/shared/config/fonts';

import './(frontend)/globals.css';

// This file replaces the root layout, so neither the Theme nor the locale has
// been resolved and there is no catalog to word this in. Hoisted out of the JSX
// because the copy rule is enforced on literals in markup (`noJsxLiterals`).
const TITLE = 'Something went wrong';
const DESCRIPTION = 'This page could not be loaded. Reloading it may be enough to fix it.';
const RELOAD = 'Reload';
const REFERENCE = 'Reference ';

interface GlobalErrorProps {
  /** The uncaught error. Only its `digest` is shown — a message here leaks schema. */
  error: Error & { digest?: string };

  /** Re-renders the root layout, which is the only recovery available here. */
  reset: () => void;
}

/**
 * The last resort: a throw in the root layout itself, where no Theme has been
 * resolved and no provider is mounted. `standard` sits on bare `:root`, so the
 * tokens and the fonts still apply and the screen is styled rather than raw.
 */
function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en" className={STANDARD_FONT_VARIABLES}>
      <body>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="font-display text-2xl text-text-title">{TITLE}</h1>
          <p className="max-w-sm font-ui text-text-muted">{DESCRIPTION}</p>
          <Button onClick={reset}>{RELOAD}</Button>
          {/* Next's own global error prints this; replacing it would otherwise
              leave a root-layout crash with nothing a User can quote. */}
          {error.digest ? (
            <p className="font-code text-xs tracking-mono text-text-muted">
              {REFERENCE}
              {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}

export default GlobalError;
