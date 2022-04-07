#!/usr/bin/env bash

set -e

npx nx bootstrap cms
npx nx import cms
npx nx serve cms
