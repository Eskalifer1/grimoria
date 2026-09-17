# Machine-readable surfaces

Where the sitemap and the llms text live, and how a route or a Note joins them. Titles, Open Graph
and the manifest are `metadata.md`; `robots.txt` and per-page indexing are #93's.

## The three surfaces

- **`/sitemap.xml`** — `src/app/sitemap.ts`, Next's metadata convention. It iterates
  `PUBLIC_ROUTES` (`src/constants/routes.ts`) and nothing else, absolute from `METADATA_BASE_URL`,
  with `lastModified` and an alternate per `routing.locales` plus `x-default`. **A route joins the
  sitemap by being declared `ROUTE_AUDIENCE.ANYONE` in `ROUTE_AUDIENCES`** — `PUBLIC_ROUTES` is
  derived from it, and `tsc` refuses a route left undeclared. #93 reads the same constant for
  the indexing default. A URL carries no Theme — Theme is a
  cookie, not a segment.
- **`/llms.txt`** and **`/llms-full.txt`** — route handlers under `src/app/`, both re-exporting
  `llmsTextResponse` (`src/shared/lib/llmsTextResponse.ts`) as `GET`. The body is built from
  `APP_NAME`, `APP_DESCRIPTION` and `LLMS_SECTIONS` (`src/constants/llms.ts`), **one section per
  `PUBLIC_ROUTES` key — `tsc` refuses a key missing there**. The full variant serves the same body
  until public Notes or docs give it more.

All three sit at the root of `src/app/` beside `manifest.ts`: a dotted path skips `src/proxy.ts`,
so the hidden `[theme]/[locale]` segments never wrap them.

## One sitemap file

Sitemap sharding (`generateSitemaps`) is not built. The protocol's limit is **50,000 URLs or 50 MB
per file**; the day Notes approach it, shard by Note id range and keep the static routes in shard
zero.

## How Notes join

Once Notes carry a public/private field (#2), `sitemap.ts` adds every published public Note with
`lastModified` from the document, reads through the Local API tagged `notes`, and its test proves a
private Note leaks neither URL nor title. Until then the sitemap reads no data and renders static.
