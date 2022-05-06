#!/usr/bin/env bash

set -e

if [ "$1" == "wait-for-api" ]; then
  echo "waiting for api to start at $API_URL..."
  npx wait-on -t 10000 $API_URL
  echo "api started"
fi

echo 'starting web...'
npx nx serve web | npx pino-pretty

