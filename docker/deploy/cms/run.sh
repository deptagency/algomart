#!/bin/sh
set -e

node_modules/.bin/directus bootstrap
node_modules/.bin/directus start&
sleep 30
yes | ./scripts/seed.mjs ./config.json
