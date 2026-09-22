import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import { defineConfig, devices } from '@playwright/test';

const IS_CI = Boolean(process.env.CI);

/** Migrate plus a production build, which the 60s default never covers. */
const WEB_SERVER_TIMEOUT = 5 * 60 * 1000;

/** `webServer.env` takes strings only; a dictionary from Node may hold `undefined`. */
function definedEntries(source: NodeJS.Dict<string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}

const e2eEnv = parseEnv(readFileSync('.env.e2e', 'utf8'));

// Its own port, so a dev server on 3000 is never the one reused, and the origin
// auth builds from is derived once rather than kept in step by hand.
const BASE_URL = `http://localhost:${e2eEnv.PORT}`;

// `.env.e2e` is spread over the shell's own environment on purpose: an exported
// `DATABASE_URL` pointing at Neon must not win over the throwaway Postgres.
const webServerEnv = definedEntries({ ...process.env, ...e2eEnv, BETTER_AUTH_URL: BASE_URL });

/**
 * Chromium only, against the production build with migrations applied, on the
 * database `docker-compose.yml` provides. CI builds in its own step (#42) and
 * only starts here; `docs/testing.md` → e2e.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  reporter: IS_CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: IS_CI ? 'yarn payload migrate && yarn start' : 'yarn build:migrate && yarn start',
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: WEB_SERVER_TIMEOUT,
    // Payload's logger and `next build` write to stdout; ignored, a failed migrate is a blank report.
    stdout: 'pipe',
    env: webServerEnv,
  },
});
