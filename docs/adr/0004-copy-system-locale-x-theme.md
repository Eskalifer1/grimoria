# UI copy sourced from a locale × theme resource from day one

All UI text is accessed through a lookup (e.g. `t(key)`), backed by a resource keyed as `[locale][theme][key]` — even though v1 ships a single locale. Two axes exist because dark-fantasy re-skinning (theme) and localization (future feature #11) are independent concerns that would otherwise collide: hardcoding strings now and retrofitting an i18n layer later would mean touching every UI string a second time. Adding a locale later is then just adding a column to the resource, not restructuring how copy is consumed.

**i18n library: `next-intl`**, adopted from day one even though v1 ships a single locale — the whole point of fixing the `[locale][theme][key]` shape early is to avoid retrofitting an i18n layer later, so bringing in the library at the same time is consistent with that reasoning rather than deferring it. `next-intl` is built for the Next.js App Router (server components, typed messages) rather than retrofitted onto it, unlike `i18next`/`react-i18next` which target the Pages Router more naturally.

## Shape on disk

`messages/<locale>/<theme>.json` — one full catalog per theme, e.g. `messages/en/standard.json` and `messages/en/dark-fantasy.json`. `en` is the v1 locale and its `standard` catalog is the source of truth for what keys exist.

Theme selects **which catalog is loaded**, not which key is read, so components call `t('home.title')` and never name a theme. Adding a theme is a file; adding a locale is a directory.

Both catalogs are complete rather than dark-fantasy being a sparse overlay on standard. An overlay would be shorter, but a key missing from it falls back to standard copy — printing "Create a note" inside the dark-fantasy UI, which is exactly the failure the full re-skin exists to avoid. With parallel catalogs the gap is instead a compile error: `src/i18n/messages.ts` constrains every theme catalog to the `standard` key set, so `tsc` names the missing key. The cost is real and accepted — a new string has to be written in both tonalities at once, and there is no "I'll flavor it later".

## Consequences of resolving copy on the server

Copy is resolved during server rendering, so the active theme has to be known **before** the HTML is built. Two things follow, and neither is optional:

- **Guests store the theme in a cookie, not `localStorage`.** The server never sees `localStorage`, so it would render standard copy and only swap to dark-fantasy after hydration. A flash of the wrong colors is tolerable; a flash of the wrong words is not. `src/i18n/theme.ts` is the single place this is decided — logged-in users read from their profile instead, a branch added when the `Users` collection exists (#32).
- **A theme toggle must round-trip to the server.** Flipping client state alone repaints the colors and leaves the text stale, because no new HTML was ever requested.

Reading a cookie also opts every localized route out of static rendering, and makes the response vary by cookie — a shared CDN cache would otherwise be able to serve one visitor's tonality to another. Caching for the public notes page is deferred to its own performance pass (#46); there is nothing cacheable to protect yet.

## Routing

Routes live under `src/app/[locale]/` with `localePrefix: 'as-needed'`, so v1 URLs stay clean (`/notes`, not `/en/notes`) while the segment already exists. `/en` canonically redirects to `/`. Adding a second locale (#18) is then a change to `src/i18n/routing.ts` rather than moving every route file and rewriting every link — the same retrofit-avoidance argument that motivates the resource shape above, applied to the URL.

`/admin` (ADR-0001) sits outside `[locale]`, and `src/proxy.ts` excludes it along with Payload's API and admin — locale rewriting must never touch the backend. Because the localized layout is the app's only root layout, `/admin` will need to supply its own when it's built (#37).

Navigation inside the localized tree goes through `src/i18n/navigation.ts`, not `next/link` and `next/navigation` directly, which drop the active locale.
