#!/bin/sh

set -e

cd /app

# We rely on the ENABLE_JOBS environment variable to decide whether to apply migrations
ENABLE_MIGRATIONS="${ENABLE_JOBS:-false}"

if [ "$ENABLE_MIGRATIONS" == "true" ]; then
  echo 'current version, before:'
  nx run api:migrate:currentVersion

  echo 'applying migrations...'
  nx run api:migrate:latest

  echo 'current version, after:'
  nx run api:migrate:currentVersion
fi

echo 'starting api...'
cd /app/dist/apps/api
node main.js
