#!/bin/sh
set -e

directus bootstrap
directus schema apply --yes ./snapshot.yml
directus start
