const SECONDS_PER_DAY = 60 * 60 * 24;

/** How long a session stays valid without being used. */
const SESSION_EXPIRES_IN = SECONDS_PER_DAY * 14;

/** How often using a session pushes its expiry out again. */
const SESSION_UPDATE_AGE = SECONDS_PER_DAY;

/** Random tail on a generated profile slug, which is what keeps names unique. */
const PROFILE_SLUG_SUFFIX_LENGTH = 5;

const PROFILE_SLUG_MAX_BASE_LENGTH = 40;

/** How many suffixes a sign-up tries before letting the unique index decide. */
const PROFILE_SLUG_MAX_ATTEMPTS = 3;

export {
  PROFILE_SLUG_MAX_ATTEMPTS,
  PROFILE_SLUG_MAX_BASE_LENGTH,
  PROFILE_SLUG_SUFFIX_LENGTH,
  SESSION_EXPIRES_IN,
  SESSION_UPDATE_AGE,
};
