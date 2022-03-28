#!/bin/sh

set -e

cd /app

# We rely on the ENABLE_JOBS environment variable to decide whether to apply migrations
ENABLE_MIGRATIONS="${ENABLE_JOBS:-false}"

if [ "$ENABLE_MIGRATIONS" == "true" ]; then
  echo 'current version, before:'
  npx nx run api:migrate:currentVersion

  echo 'applying migrations...'
  npx nx run api:migrate:latest

  echo 'current version, after:'
  npx nx run api:migrate:currentVersion
else
  echo 'skipping database migrations'
fi

echo 'starting api...'
cd /app/dist/apps/scribe
node main.js
