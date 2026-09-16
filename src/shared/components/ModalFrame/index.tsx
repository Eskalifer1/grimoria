'use client';

import { useParams } from 'next/navigation';

import { THEME } from '@/constants/theme';
import { toTheme } from '@/i18n/theme';
import FilamentCorner from '@/shared/assets/marks/filament-corner-dark-fantasy.svg';

/* A 1px ring of the panel's radius, bright in two runs and dark between. */
const RING_CLASS = [
  'absolute inset-0 rounded-[inherit] p-px opacity-40',
  '[background:conic-gradient(from_30deg,transparent_0_6%,var(--filament-edge)_14%,transparent_22%_56%,var(--filament-edge)_64%,transparent_72%)]',
  '[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]',
].join(' ');

/* The halo runs past the panel's edge; the SVG viewport would otherwise cut it. */
const CORNER_CLASS = 'absolute size-40 overflow-visible';

/**
 * The vine along a modal panel's edge in `dark-fantasy` — one corner mark at two
 * opposite corners and a lit run between them, colored by `--filament-*`;
 * nothing in `standard`. The Theme is the route's `[theme]` segment. Decorative:
 * the panel is named by its title.
 */
function ModalFrame() {
  const params = useParams<{ theme?: string }>();

  if (toTheme(params?.theme) !== THEME.DARK_FANTASY) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      data-slot="modal-frame"
    >
      <span className={RING_CLASS} />
      <FilamentCorner className={`${CORNER_CLASS} top-0 left-0`} />
      <FilamentCorner className={`${CORNER_CLASS} right-0 bottom-0 rotate-180`} />
    </div>
  );
}

export { ModalFrame };
