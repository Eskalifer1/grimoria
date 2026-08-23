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
  HOME: '/',

  /** The signed-in User's own profile screen. */
  PROFILE: '/profile',

  /** Payload's admin. Passed to `routes.admin`, which is what mounts it. */
  ADMIN: '/cms',
} as const;

/**
 * The same routes as Next matches them internally, with their dynamic segments
 * intact. `revalidatePath` takes these, never a `ROUTES` value: every page sits
 * under `[locale]`, so revalidating `/profile` matches nothing and leaves the
 * screen reading stale data. One entry per route that a write invalidates.
 */
const ROUTE_PATTERNS = {
  /** `ROUTES.PROFILE` under its locale segment — every locale at once. */
  PROFILE: '/[locale]/profile',
} as const;

export { ROUTE_PATTERNS, ROUTES };
