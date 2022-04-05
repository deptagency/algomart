#!/usr/bin/env bash

set -e

if [ -z "$STORAGE_GCP_CREDENTIALS" ]; then
  echo "No STORAGE_GCP_CREDENTIALS provided."
else
  echo $STORAGE_GCP_CREDENTIALS > /app/gcp-credentials.json
fi

directus bootstrap
directus schema apply --yes ./snapshot.yml
directus start
