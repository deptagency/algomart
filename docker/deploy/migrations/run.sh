#!/usr/bin/env bash

set -e

echo 'current version, before:'
nx run migrations:currentVersion

echo 'applying migrations...'
nx run migrations:latest

echo 'current version, after:'
nx run migrations:currentVersion
