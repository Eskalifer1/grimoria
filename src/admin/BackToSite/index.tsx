import { APP_NAME } from '@/constants/app';
import { ROUTES } from '@/constants/routes';

/**
 * The admin has no route back to the app on its own, and `/cms` is a separate
 * router tree, so this is a plain anchor rather than a next-intl `Link` — the
 * return trip is a full navigation either way.
 */
function BackToSite() {
  return (
    <a className="nav__link" href={ROUTES.HOME}>
      {`← ${APP_NAME}`}
    </a>
  );
}

export { BackToSite };
