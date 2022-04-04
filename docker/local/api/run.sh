#!/usr/bin/env bash

set -e

cd /app

echo $0

if [ "$1" == "wait-for-cms" ]; then
  echo "waiting for cms to start at $CMS_URL..."
  npx wait-on -t 10000 $CMS_URL
  echo "cms started"
fi

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
  echo 'skipping migrations'
fi

echo 'starting api...'
npx nx serve api
