# Metadata

What a page's `<head>` carries — title, description, Open Graph, Twitter card, `theme-color`,
`robots`, canonical, `hreflang` — and the one call that gives a page its own. The sitemap,
`robots.txt` and `/llms.txt` are `machine-readable.md`; the icons and the share card file are
`design/logo.md`.

## The contract

**The root layout owns everything global** — `generateMetadata` and `generateViewport` in
`src/app/(frontend)/[theme]/[locale]/layout.tsx`. Icons and the Open Graph image stay on Next's
file conventions beside the layout; nothing lists them by hand.

**A page adds its own with one line and no other metadata code:**

```ts
export const generateMetadata = pageMetadata('profilePage', 'PROFILE');
```

`pageMetadata` (`src/i18n/pageMetadata.ts`) reads the page's `title` and `description` from
`meta.json` and mirrors both into `openGraph`, over the root's resolved `openGraph` — Next
replaces a segment's `openGraph` wholesale rather than filling `og:title` from `title`, and the
root's `og:image`, `og:site_name`, `og:locale` and `og:type` would go with it. **The namespace is
`keyof` the `pages` block of `meta.json`**, so adding a page there is what admits it.

**The second argument is the page's `FRONTEND_ROUTES` key, and it is required** — the route's
row in `ROUTE_AUDIENCES` (`src/constants/routes.ts`) decides indexing, so a private screen cannot
be indexed by omission. A layout group per audience lost: it would declare the same fact twice.

**The optional third argument is `Metadata` minus `title`, `description`, `robots` and
`alternates`** — an image, `openGraph.type: 'article'`, `publishedTime` — merged over the
mirrored fields. Title and description come from the catalog only, or `<title>` and `og:title`
would split; `robots` and `alternates` come from the route only.

**Every `page.tsx` under `(frontend)` makes the call, save the catch-all** — Next drops a page's
metadata when it throws `notFound()`, so a `generateMetadata` there is dead code.
`tests/app/themeSegment.test.ts` fails on any other page without it.

## Indexing

**`ROUTE_AUDIENCE.ANYONE` → `index, follow`**, a self-referencing canonical for the page's own
locale, and an `hreflang` per `routing.locales` plus `x-default` on the default locale.
**`GUEST` or `USER` → `noindex, nofollow`** and no `alternates` at all — a canonical on a page
that asks to be dropped is noise.

**URLs come from `localizedUrl` in `src/i18n/localizedUrl.ts`**, shared with the sitemap: default
locale bare, other locales prefixed, absolute from `METADATA_BASE_URL`. Theme never enters a URL —
the proxy 308s any Theme-prefixed path to the visible one. A second locale changes `routing.ts`
and touches nothing here.

**No page-level `noindex` off production.** Vercel sends `X-Robots-Tag: noindex` on preview URLs
itself, and `robots.txt` (`machine-readable.md`) covers a preview on a custom domain.

**A signed-out visitor on a `USER` page sees two `robots` tags** — ours, and the `noindex` Next
adds on its own `unauthorized()` boundary. Both say the same thing.

## The catalog

**Head copy is `messages/<locale>/meta.json`, keyed by locale alone** — `site.description` for
the root, one `pages.<namespace>` entry per page — read through `getMetaMessages` in
`src/i18n/metaMessages.ts`, never through `request.ts`. A share card and a tab title are seen by
people with no Theme, so the Theme catalogs carry no head copy; and `request.ts`'s catalog is
handed whole to `NextIntlClientProvider`, so anything in it rides to the client. This is what
keeps both prerendered Themes emitting one `<head>` (ADR-0015).

`APP_NAME` stays a constant — it is the brand, not copy. `APP_DESCRIPTION` serves the manifest
and `/llms.txt`, neither of which has a locale.

## `theme-color`

**One color per Theme, never per color scheme** — `generateViewport` resolves the Theme through
`resolveTheme` and reads `THEME_COLOR` in `src/constants/theme.ts`, each Theme's `--surface-page`
as a hex, mirrored by hand from `src/styles/` because a `<meta>` cannot read a CSS variable. The OS
color scheme picks no Theme here (`docs/features/dark-fantasy-theme.md`).

## `og:locale`

Open Graph spells a locale `language_TERRITORY`; the route carries only the language.
`toOpenGraphLocale` in `src/i18n/openGraphLocale.ts` maps each route locale, and a second locale
adds a row there.

## Static rendering

**Both readers touch only `next/root-params`** — `resolveTheme` and `resolveLocale` — never a
cookie, a header or a session, which is what keeps every Theme × locale prerendered
(`docs/agents/coding-standards/routing.md`).
