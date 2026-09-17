# Machine-readable surfaces

Where the sitemap, `robots.txt` and the llms text live, and how a route or a Note joins them.
Titles, Open Graph and per-page indexing (`robots`, canonical, `hreflang`) are `metadata.md`.

## The four surfaces

- **`/sitemap.xml`** — `src/app/sitemap.ts`, Next's metadata convention. It iterates
  `PUBLIC_ROUTES` (`src/constants/routes.ts`) and nothing else, absolute from `METADATA_BASE_URL`,
  with `lastModified` and an alternate per `routing.locales` plus `x-default`. **A route joins the
  sitemap by being declared `ROUTE_AUDIENCE.ANYONE` in `ROUTE_AUDIENCES`** — `PUBLIC_ROUTES` is
  derived from it, and `tsc` refuses a route left undeclared; `pageMetadata` reads the same row
  for the indexing default. URLs come from `localizedUrl` (`src/i18n/localizedUrl.ts`), shared
  with `pageMetadata`; none carries a Theme — Theme is a cookie, not a segment.
- **`/robots.txt`** — `src/app/robots.ts`, Next's metadata convention. **On Vercel production it
  allows `/`, disallows `ROUTES.ADMIN` and `ROUTES.API`, and names the absolute sitemap URL. On any
  other deployment — preview, a custom-domain branch, local — it disallows everything.** The
  signal is `IS_PRODUCTION_DEPLOYMENT` (`VERCEL_ENV === 'production'`, `src/constants/env.ts`);
  `NODE_ENV` lost because a preview build reports `production` too. Private pages are not listed:
  a crawler cannot read `noindex` on a URL robots.txt blocks, and robots.txt is public — their
  `noindex` comes from `pageMetadata`.
- **`/llms.txt`** and **`/llms-full.txt`** — route handlers under `src/app/`, both re-exporting
  `llmsTextResponse` (`src/shared/lib/llmsTextResponse.ts`) as `GET`. The body is built from
  `APP_NAME`, `APP_DESCRIPTION` and `LLMS_SECTIONS` (`src/constants/llms.ts`), **one section per
  `PUBLIC_ROUTES` key — `tsc` refuses a key missing there**. The full variant serves the same body
  until public Notes or docs give it more.

All four sit at the root of `src/app/` beside `manifest.ts`: a dotted path skips `src/proxy.ts`,
so the hidden `[theme]/[locale]` segments never wrap them.

## One sitemap file

Sitemap sharding (`generateSitemaps`) is not built. The protocol's limit is **50,000 URLs or 50 MB
per file**; the day Notes approach it, shard by Note id range and keep the static routes in shard
zero.
