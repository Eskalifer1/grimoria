import config from '@payload-config';
import { getPayloadAuth } from 'payload-auth/better-auth/plugin';

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
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME ?? 'Admin';

if (!email || !password) {
  throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running the seed');
}

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
