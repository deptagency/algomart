#!/bin/sh
set -e

npm install
npm run build:schemas

npm -w @algomart/api run db:latest

echo
echo "Waiting on CMS"
node_modules/.bin/wait-on $CMS_URL

echo
echo "Starting dev server"
npm -w @algomart/api run dev --
