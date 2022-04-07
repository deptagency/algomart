#!/usr/bin/env bash

set -e

if [ -z "$STORAGE_GCP_CREDENTIALS" ] || [ -z "$STORAGE_GCP_KEY_FILENAME" ]; then
  echo "No STORAGE_GCP_CREDENTIALS or STORAGE_GCP_KEY_FILENAME provided."
else
  echo "Writing GCP credentials to $STORAGE_GCP_KEY_FILENAME"
  echo $STORAGE_GCP_CREDENTIALS > $STORAGE_GCP_KEY_FILENAME
fi

directus bootstrap
directus schema apply --yes ./snapshot.yml
directus start
