import { describe, expect, it } from 'vitest';

import { FRONTEND_ROUTES } from '@/constants/routes';

import { listSourceFiles, toRepoPath } from '../fixtures/sourceTree';

const SITE_ROOT = 'src/app/(frontend)/[theme]/[locale]/(site)/';

/** The catch-all answers every unknown URL with `notFound()`, so it is no route. */
const CATCH_ALL = `${SITE_ROOT}[...rest]/page.tsx`;

/** The URL a `page.tsx` under `(site)` serves, route groups dropped. */
function pageRoute(repoPath: string): string {
  const segments = repoPath
    .slice(SITE_ROOT.length, -'/page.tsx'.length)
    .split('/')
    .filter((segment) => segment && !segment.startsWith('('));

  return `/${segments.join('/')}`;
}

describe('the route registry', () => {
  it('names every (site) page in FRONTEND_ROUTES, and every entry has a page', () => {
    const pages = listSourceFiles()
      .map(toRepoPath)
      .filter((repoPath) => repoPath.startsWith(SITE_ROOT) && repoPath.endsWith('/page.tsx'))
      .filter((repoPath) => repoPath !== CATCH_ALL)
      .map(pageRoute)
      .sort();

    expect(pages).toEqual(Object.values(FRONTEND_ROUTES).sort());
  });
});
