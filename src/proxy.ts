import { type NextRequest, NextResponse } from 'next/server';

import createMiddleware from 'next-intl/middleware';

import { THEME_COOKIE_NAME, THEMES } from '@/constants/theme';
import { routing } from '@/i18n/routing';
import { toTheme } from '@/i18n/theme';

const handleI18nRouting = createMiddleware(routing);

/** One hidden segment: where a visitor's value is stored, and which values exist. */
interface HiddenAxis {
  cookie: string;
  values: readonly string[];
  /** Narrows the stored value, answering the default for anything unrecognized. */
  toValue: (stored: string | undefined) => string;
}

/**
 * The hidden segments, in the order they appear in the internal path. A second
 * axis — a copy tonality apart from the color Theme — is a row here and no other
 * change.
 *
 * The locale is not a row: next-intl owns it, and a locale in the URL is a link
 * somebody may legitimately share, so it is stripped only when it is the default.
 */
const HIDDEN_AXES: readonly HiddenAxis[] = [
  { cookie: THEME_COOKIE_NAME, values: THEMES, toValue: toTheme },
];

/** The path's first segment, without splitting the rest of it into an array. */
function firstSegment(pathname: string): string {
  const end = pathname.indexOf('/', 1);

  return end === -1 ? pathname.slice(1) : pathname.slice(1, end);
}

function isHiddenSegment(segment: string): boolean {
  return HIDDEN_AXES.some((axis) => axis.values.includes(segment));
}

/**
 * The address a visitor is allowed to hold: every hidden segment off the front,
 * and the default locale with them. Leaving `/en` behind would only make
 * next-intl redirect a second time.
 */
function toVisiblePath(segments: readonly string[]): string {
  const withoutAxes = HIDDEN_AXES.reduce<readonly string[]>(
    (rest, axis) => (axis.values.includes(rest[0] ?? '') ? rest.slice(1) : rest),
    segments,
  );
  const visible = withoutAxes[0] === routing.defaultLocale ? withoutAxes.slice(1) : withoutAxes;

  return `/${visible.join('/')}`;
}

/** The hidden segments this visitor renders under, from their cookies. */
function hiddenPrefix(request: NextRequest): string {
  return HIDDEN_AXES.map(
    (axis) => `/${axis.toValue(request.cookies.get(axis.cookie)?.value)}`,
  ).join('');
}

/**
 * Turns the visible URL into the internal `/[theme]/[locale]/…` one Next
 * renders, so both Themes can be prerendered while `/notes` stays `/notes`.
 * The hidden segments come from cookies — no database call, for anyone.
 */
export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // An internal path reached from outside is a second address for one page. A
  // 308 closes it without punishing whoever clicked the link. Only the first
  // segment decides, so the path is not split until one of them matches.
  if (isHiddenSegment(firstSegment(pathname))) {
    // The whole URL, with only the path replaced — building one from the path
    // alone would leave the query behind.
    const clean = new URL(request.nextUrl);

    clean.pathname = toVisiblePath(pathname.split('/').slice(1));

    return NextResponse.redirect(clean, 308);
  }

  const response = handleI18nRouting(request);

  // next-intl answered with a redirect of its own — a locale prefix to strip.
  if (response.headers.has('location')) {
    return response;
  }

  // Its rewrite, read back off the header because next-intl exposes the decision
  // nowhere else. Absent when the visible path was already canonical.
  const rewritten = response.headers.get('x-middleware-rewrite') ?? request.nextUrl.toString();
  const target = new URL(rewritten, request.nextUrl);

  target.pathname = `${hiddenPrefix(request)}${target.pathname}`;

  // `rewrite` sets the same header, and carries next-intl's own cookies and
  // `vary` over with it.
  return NextResponse.rewrite(target, response);
}

export const config = {
  // Everything except the paths that must never be locale-rewritten: Payload's
  // built-in admin at `/cms` and its REST API under `/api`, Next's
  // internals, and any request for a real file.
  matcher: ['/((?!cms|api|_next|_vercel|.*\\..*).*)'],
};
