#!/usr/bin/env bash

set -e

cd /app

if [ "$1" == "wait-for-cms" ]; then
  echo "waiting for cms to start at $CMS_URL..."
  npx wait-on -t 10000 $CMS_URL
  echo "cms started"
fi

echo 'starting api...'
cd /app/dist/apps/api
node main.js
#
