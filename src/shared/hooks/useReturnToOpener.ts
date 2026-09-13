'use client';

import { useRef } from 'react';

interface ReturnToOpener {
  /** Records what is focused as the panel opens, before the panel takes focus. */
  onOpenAutoFocus: () => void;

  /** Puts focus back on the opener, when it is still in the document. */
  onCloseAutoFocus: (event: Event) => void;
}

/**
 * Returns focus to whatever opened a modal. Radix only does this through its own
 * `Trigger`, which a controlled modal has none of — closed, it would leave a
 * keyboard User on the document body (WCAG 2.2 AA, 2.4.3). The opener gone with
 * the change, Radix's own fallback stands.
 *
 * @returns the two handlers a Radix `Content` takes
 */
function useReturnToOpener(): ReturnToOpener {
  const opener = useRef<Element | null>(null);

  return {
    onOpenAutoFocus: () => {
      opener.current = document.activeElement;
    },
    onCloseAutoFocus: (event) => {
      const target = opener.current;

      if (target instanceof HTMLElement && target.isConnected) {
        event.preventDefault();
        target.focus();
      }
    },
  };
}

export { useReturnToOpener };
