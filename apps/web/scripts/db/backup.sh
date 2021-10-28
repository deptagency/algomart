#!/usr/bin/env bash

# usage: ./scripts/db/backup.sh [output.backup]
# Requires DATABASE_URL to be set in the environment.

# pg_dump options
# --blobs - include large objects in dump
# --dbname - connect to database name (can also be a postgres connection string)
# --file - output file or directory name
# --format=c - output file format (c is custom format, compatible with pg_restore)
# --no-owner - skip restoration of object ownership in plaintext format
# --verbose - verbose mode

pg_dump \
  --blobs \
  --dbname=$DATABASE_URL \
  --file="${1:-db.backup}" \
  --format=c \
  --no-owner \
  --verbose \
