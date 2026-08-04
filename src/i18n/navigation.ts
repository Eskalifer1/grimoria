import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

// Use these instead of the equivalents from `next/link` and `next/navigation`:
// they carry the active locale through, which plain `next/*` navigation drops.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
