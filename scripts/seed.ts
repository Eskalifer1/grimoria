import config from '@payload-config';
import { getPayloadAuth } from 'payload-auth/better-auth/plugin';

import { parseSeedEnv } from '@/constants/env';

/**
 * Makes the first admin exist with the password in `SEED_ADMIN_*` — `yarn seed`,
 * safe to re-run. A new account is created through Better Auth's own sign-up so
 * the password is hashed exactly as a real registration hashes it; an existing
 * one has its credential rewritten, which is what makes a re-run change the
 * password rather than silently keep the old one.
 *
 * The role is written through the Local API afterwards, the only path allowed
 * to touch `role` at all.
 */
const {
  SEED_ADMIN_EMAIL: email,
  SEED_ADMIN_NAME: name,
  SEED_ADMIN_PASSWORD: password,
} = parseSeedEnv();

const payload = await getPayloadAuth(config);

const existing = (
  await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })
).docs[0];

let userId: string;

if (existing) {
  const auth = await payload.betterAuth.$context;

  userId = String(existing.id);

  const hashedPassword = await auth.password.hash(password);
  const accounts = await auth.internalAdapter.findAccounts(userId);

  if (accounts.some((account) => account.providerId === 'credential')) {
    await auth.internalAdapter.updatePassword(userId, hashedPassword);
  } else {
    await auth.internalAdapter.createAccount({
      accountId: userId,
      password: hashedPassword,
      providerId: 'credential',
      userId,
    });
  }
} else {
  const created = await payload.betterAuth.api.signUpEmail({ body: { email, name, password } });

  userId = created.user.id;
}

await payload.update({
  collection: 'users',
  data: { role: ['admin'] },
  id: userId,
});

payload.logger.info(`Seeded admin ${email}`);
process.exit(0);
