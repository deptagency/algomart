#!/bin/sh

set -e

cd /app

echo 'current version, before:'
npx nx run api:migrate:currentVersion

echo 'applying migrations...'
npx nx run api:migrate:latest

echo 'current version, after:'
npx nx run api:migrate:currentVersion

echo 'starting api...'
cd /app/dist/apps/api
node main.js
