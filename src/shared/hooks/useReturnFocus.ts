'use client';

import type { RefObject } from 'react';

/** The `input` types that carry a selection at all. `setSelectionRange` throws on the rest. */
const CARET_INPUT_TYPES = new Set(['text', 'search', 'url', 'tel', 'password']);

function ancestorsOf(from: HTMLElement | null): HTMLElement[] {
  const chain: HTMLElement[] = [];

  for (let node = from?.parentElement ?? null; node; node = node.parentElement) {
    chain.push(node);
  }

  return chain;
}

/**
 * A browser restores the selection an element held the last time it was focused,
 * and one never focused has none — so a bare `focus()` lands at index 0, in front
 * of what is there, and typing prepends.
 */
function caretToEnd(node: HTMLElement) {
  const isCaretField =
    node instanceof HTMLTextAreaElement ||
    (node instanceof HTMLInputElement && CARET_INPUT_TYPES.has(node.type));

  if (!isCaretField) {
    return;
  }

  node.setSelectionRange(node.value.length, node.value.length);
}

function focusSurvivor(intended: HTMLElement | null, chain: readonly HTMLElement[]) {
  if (intended?.isConnected) {
    intended.focus();
    caretToEnd(intended);

    return;
  }

  const survivor = chain.find((node) => node.isConnected);

  if (!survivor) {
    return;
  }

  // `tabindex="-1"` keeps it out of the tab order while letting it be reached.
  if (!survivor.hasAttribute('tabindex')) {
    survivor.tabIndex = -1;
  }

  survivor.focus();
}

/**
 * Runs something that removes the focused control, then puts focus somewhere a
 * keyboard User can carry on from. A browser drops focus to the document body
 * when the focused element leaves the document, which returns them to the top of
 * the page with no way back (WCAG 2.2 AA, 2.4.3).
 *
 * The intended target needs `tabIndex={-1}` unless it is focusable already. A
 * change that takes the target with it — a failed create dismissed row and all —
 * falls back to the nearest ancestor still standing.
 *
 * @param removing the element being removed, whose ancestors are the fallback
 * @param intended where focus belongs afterwards
 */
function useReturnFocus(
  removing: RefObject<HTMLElement | null>,
  intended?: RefObject<HTMLElement | null>,
): (change: () => void) => void {
  return (change: () => void) => {
    const standing = ancestorsOf(removing.current);

    change();

    // After the commit, not before it: what the change removes is not gone from
    // the document until React has painted.
    requestAnimationFrame(() => {
      focusSurvivor(intended?.current ?? null, standing);
    });
  };
}

export { useReturnFocus };
