#!/bin/sh
set -e

node_modules/.bin/directus bootstrap
node_modules/.bin/directus start & yes | ./scripts/seed.mjs ./config.json
