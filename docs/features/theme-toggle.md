# Theme Toggle

How a User or a Guest changes the Theme, and why the switch is a round trip. The Theme's place in
the render path is ADR-0015; the cookie reconciliation at sign-in is `docs/features/auth.md`.

## The mechanism

- **One open Server Action, `setTheme` (`src/api/user/setTheme/`)**, writes the `theme` cookie
  first and answers — the cookie is what renders, and the call waits on no database. With a session
  the profile write runs in `after()`, once the response is out, under `overrideAccess: false`; a
  refusal or an outage there is logged and never reaches the device. The Theme is a preference: the
  cookie wins on this device, and the next sign-in reconciles `user.theme` from whichever moved.
  The tags go through `revalidateTag(…, 'max')` in the same deferred step — `updateTag` is
  action-phase only.
- **The cookie is written in one shape everywhere.** `THEME_COOKIE_OPTIONS` in
  `src/constants/theme.ts` is what the action and `sessionCookiesPlugin` both write.
- **`ThemeToggle` (`src/features/theme/components/ThemeToggle/`)** is a `RadioGroup` over
  `THEMES`, checked from the Theme the mounting Server Component resolved. Pattern B with
  `onFailure: 'rollback'` (`docs/features/data-access/pattern-b.md`), keyed on
  `THEME_OPTIMISTIC_KEY` — a device-level key, so a Guest and a User write the same entry.
- **The refresh is an effect, not a callback.** Once the overlay settles on a Theme the page was
  not rendered in — this tab's write, or one adopted from another tab through the store's sync —
  the component calls `router.refresh()`, and the proxy rewrites onto the new segment. Nothing in
  the component touches `data-theme` or the tokens: a client-side flip would repaint the colors and
  leave the copy in the old tonality, because the Theme selects the catalog. A superseded answer
  refreshes nothing, so two quick clicks cost one refresh.
- **Home until Settings (#5).** The control sits on the home page behind
  `NODE_ENVIRONMENT !== 'production'`, beside the playgrounds.

## Where it is checked

`tests/api/user/setTheme.test.ts` (schema, Guest and User paths, a refused write kept off the answer),
`tests/api/user/setThemeOptimistic.test.ts`, `tests/features/theme/components/ThemeToggle.test.tsx`
(checked follows the prop, refresh on success, rollback and reason on failure), and
`tests/app/themeSegment.test.ts`, which names the action as the one file besides the proxy that may
touch the Theme cookie.
