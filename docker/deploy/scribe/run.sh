#!/bin/sh

set -e

cd /app

if [ "$1" == "wait-for-cms" ]; then
  echo "waiting for cms to start at $CMS_URL..."
  npx wait-on -t 10000 $CMS_URL
  echo "cms started"
fi

echo 'current version, before:'
npx nx run scribe:migrate:currentVersion

echo 'applying migrations...'
npx nx run scribe:migrate:latest

echo 'current version, after:'
npx nx run scribe:migrate:currentVersion

echo 'starting scribe...'
cd /app/dist/apps/scribe
node main.js
