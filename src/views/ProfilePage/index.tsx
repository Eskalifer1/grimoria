import { unauthorized } from 'next/navigation';
import { Suspense } from 'react';

import { getTranslations } from 'next-intl/server';

import { getCurrentUser } from '@/api/user/getCurrentUser';
import { recordTag } from '@/constants/cacheTags';
import { Loader } from '@/shared/components/Loader';
import { OptimisticText } from '@/shared/components/OptimisticText';
import { Page } from '@/shared/components/Page';

import { ProfileNameForm } from './ProfileNameForm';

// Throwaway surface proving the #49 data path end to end: one Local API read on
// the server, one optimistic write from a client leaf. #1 replaces it.
async function ProfilePage() {
  const t = await getTranslations('profilePage');

  return (
    <Page
      title={t('title')}
      status={
        <Suspense fallback={null}>
          <ProfileStatus />
        </Suspense>
      }
    >
      <Suspense fallback={<Loader />}>
        <ProfileSection />
      </Suspense>
    </Page>
  );
}

/**
 * The masthead status line, a hole of its own: the shell owns the line, the User
 * fills it in. Read through the store, so the name the form just sent shows here
 * on the same keystroke — the form owns the write, this line only mirrors it.
 */
async function ProfileStatus() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <OptimisticText
      storeKey={recordTag('users', user.id)}
      field="name"
      value={user.name}
      version={user.updatedAt}
    />
  );
}

/** The live hole under the masthead: the per-User read, so the shell stays prerendered. */
async function ProfileSection() {
  const user = await getCurrentUser();

  if (!user) {
    // A 401 surface rather than a redirect home, so a signed-out visitor is told
    // what happened instead of landing somewhere they did not ask for.
    unauthorized();
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-card p-6">
      <ProfileNameForm id={user.id} name={user.name} updatedAt={user.updatedAt} />
    </section>
  );
}

export { ProfilePage, ProfileSection, ProfileStatus };
