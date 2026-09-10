/**
 * The routes the hidden `[theme]/[locale]` segments wrap — every screen the
 * product renders. Payload's admin is not one of them, which is why it sits
 * apart: it is mounted outside the frontend tree and has no Theme.
 */
const FRONTEND_ROUTES = {
  HOME: '/',

  /** The signed-in User's own profile screen. */
  PROFILE: '/profile',
} as const;

/**
 * Every path the app links to, redirects to, or configures. A route exists
 * twice — as a folder under `app/` and as an entry here (`routing.md`) — so a
 * path written inline is a rename nobody can grep for.
 *
 * One object rather than loose names, because these are read as a set. Its own
 * file rather than a section of another: a constants module is imported by
 * every layer, so whatever it imports, they all inherit.
 */
const ROUTES = {
  ...FRONTEND_ROUTES,

  /** Payload's admin. Passed to `routes.admin`, which is what mounts it. */
  ADMIN: '/cms',
} as const;

type FrontendRoute = (typeof FRONTEND_ROUTES)[keyof typeof FRONTEND_ROUTES];

/** The two segments the proxy rewrites onto every frontend request. */
const HIDDEN_SEGMENTS = '/[theme]/[locale]';

/**
 * One route as Next matches it internally, with its dynamic segments intact.
 *
 * @param route anything but `ROUTES.HOME`, whose bare `/` would leave a trailing
 *   slash — the home pattern is `HIDDEN_SEGMENTS` itself
 */
function routePattern(route: Exclude<FrontendRoute, typeof FRONTEND_ROUTES.HOME>): string {
  return `${HIDDEN_SEGMENTS}${route}`;
}

/**
 * The same routes as Next matches them. `revalidatePath` takes these, never a
 * `ROUTES` value: every page sits under `[theme]/[locale]`, so revalidating
 * `/profile` matches nothing and leaves the screen reading stale data. One entry
 * covers every Theme and locale at once.
 *
 * Built once here rather than at each call site, so a hundred writes name a
 * constant instead of calling a function. The `Record` key type is what makes a
 * route added to `FRONTEND_ROUTES` and forgotten here a compile error.
 */
const ROUTE_PATTERNS: Record<keyof typeof FRONTEND_ROUTES, string> = {
  HOME: HIDDEN_SEGMENTS,
  PROFILE: routePattern(FRONTEND_ROUTES.PROFILE),
};

export type { FrontendRoute };
export { FRONTEND_ROUTES, ROUTE_PATTERNS, ROUTES };
