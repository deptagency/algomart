#!/usr/bin/env bash

# usage: ./scripts/db/restore.sh [db.backup]
# Requires DATABASE_URL to be set in the environment.

# helper function
confirm() {
    # call with a prompt string or use a default
    read -r -p "${1:-Are you sure? [y/N]} " response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            true
            ;;
        *)
            false
            ;;
    esac
}

# pg_restore options
# --clean - clean (drop) database objects before recreating
# --dbname - connect to database name (can also be a postgres connection string)
# --exit-on-error - exit on error, default is to continue
# --if-exists - use IF EXISTS when dropping objects
# --no-owner - skip restoration of object ownership
# --no-privileges - skip restoration of access privileges (grant/revoke)
# --verbose - verbose mode

confirm "WARNING! This will clear out any existing data. Are you sure? [y/N]" \
    && pg_restore \
        --clean \
        --dbname=$DATABASE_URL \
        --exit-on-error \
        --if-exists \
        --no-owner \
        --no-privileges \
        --verbose \
        "${1:-db.backup}"
