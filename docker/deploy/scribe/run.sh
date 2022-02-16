#!/usr/bin/env bash

set -e

cd /app

echo 'current version, before:'
nx run scribe:migrate:currentVersion

echo 'applying migrations...'
nx run scribe:migrate:latest

echo 'current version, after:'
nx run scribe:migrate:currentVersion

echo 'starting scribe...'
cd /app/dist/apps/scribe
node main.js
