import { useTranslations } from 'next-intl';

// Placeholder surface until real screens exist. Its only job is to prove the
// pipeline end to end: switching the `theme` cookie between `standard` and
// `dark-fantasy` changes every string below without this file changing at all.
export default function HomePage() {
  const t = useTranslations('homePage');

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('empty')}</p>
      <button type="button">{t('createNote')}</button>
    </main>
  );
}
