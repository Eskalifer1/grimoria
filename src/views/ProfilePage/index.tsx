import { unauthorized } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { getCurrentUser } from '@/api/user/getCurrentUser';

import { ProfileNameForm } from './ProfileNameForm';

// Throwaway surface proving the #49 data path end to end: one Local API read on
// the server, one optimistic write from a client leaf. #1 replaces it.
async function ProfilePage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations('profilePage')]);

  if (!user) {
    // A 401 surface rather than a redirect home, so a signed-out visitor is told
    // what happened instead of landing somewhere they did not ask for.
    unauthorized();
  }

  return (
    <main className="p-8">
      <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-card p-6">
        <h1 className="font-display text-2xl text-text-title">{t('title')}</h1>
        <p className="font-ui text-text-muted">{user.email}</p>
        <ProfileNameForm id={user.id} name={user.name} updatedAt={user.updatedAt} />
      </section>
    </main>
  );
}

export { ProfilePage };
