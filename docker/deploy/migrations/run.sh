#!/usr/bin/env bash

set -e

echo 'current version, before:'
nx run api:migrate:currentVersion

echo 'applying migrations...'
nx run api:migrate:latest

echo 'current version, after:'
nx run api:migrate:currentVersion
