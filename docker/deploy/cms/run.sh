#!/usr/bin/env bash

set -e

envsubst "`env | awk -F = '{printf \" \\\\$%s\", $1}'`" \
  < /etc/nginx/sites-available/default.template \
  > /etc/nginx/sites-available/default

echo 'start nginx in background'
nginx -g "daemon off;" &

npx directus bootstrap
npx directus schema apply --yes ./snapshot.yml
# force PORT=8055 here as Nginx will run on the "public" PORT
PORT=8055 npx directus start
