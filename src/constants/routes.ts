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

  /** Payload's admin. Passed to `routes.admin`, which is what mounts it. */
  ADMIN: '/cms',
} as const;

export { ROUTES };
