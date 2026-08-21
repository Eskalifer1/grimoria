#!/usr/bin/env bash
#
# Proves a migration's `down` half against a throwaway database: apply, roll
# back, apply again. Cutting a Neon branch off `main` and deleting it afterwards
# stays manual — see docs/database-migrations.md.
#
#   yarn migrate:verify-rollback 'postgresql://…'

set -euo pipefail

connection_string="${1:-}"

if [[ -z "$connection_string" ]]; then
  echo "usage: yarn migrate:verify-rollback <direct-connection-string>" >&2
  echo "Cut a throwaway Neon branch off main, pass its direct string, delete it after." >&2
  exit 1
fi

# Neon's pooled endpoint runs PgBouncer in transaction mode and cannot perform
# schema work, so a pooled string here fails halfway through with a confusing
# error instead of up front with this one.
if [[ "$connection_string" == *-pooler.* ]]; then
  echo "That is the pooled string. Schema work needs the direct one (no '-pooler')." >&2
  exit 1
fi

# @next/env, which Payload's CLI loads, leaves variables already in the
# environment alone — so these win over .env and the cycle cannot reach dev.
export DATABASE_URL="$connection_string"
export DATABASE_URL_UNPOOLED="$connection_string"

echo "==> apply"
yarn payload migrate

echo "==> roll back the last batch"
yarn payload migrate:down

echo "==> apply again"
yarn payload migrate

echo "==> down works. Delete the throwaway branch now."
