#!/usr/bin/env bash

set -e


echo 'current version, before:'
npx nx run api:migrate:currentVersion

echo 'applying migrations...'
npx nx run api:migrate:latest

echo 'current version, after:'
npx nx run api:migrate:currentVersion


echo 'starting scribe...'
npx nx serve scribe | npx pino-pretty
