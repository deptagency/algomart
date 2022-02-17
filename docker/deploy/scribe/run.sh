#!/usr/bin/env bash

set -e

cd /app

echo 'starting scribe...'
cd /app/dist/apps/scribe
node main.js
