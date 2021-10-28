#!/bin/sh
set -e

echo
echo "Waiting on API"
node_modules/.bin/wait-on $API_URL/docs/static/index.html

echo
echo "Starting dev server"
npm -w @algomart/web run dev --
