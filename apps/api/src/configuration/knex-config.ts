import { Knex } from 'knex'
import path from 'node:path'

import { Configuration } from '.'

export function buildKnexMainConfiguration(): Knex.Config {
  return {
    client: 'pg',
    connection: Configuration.databaseMainUrl,
    searchPath: [Configuration.databaseSchema],
    pool: {
      min: Configuration.databaseMainMinPool,
      max: Configuration.databaseMainMaxPool,
    },
    migrations: {
      extension: 'ts',
      directory: path.join(__dirname, '..', 'migrations'),
    },
  }
}

export function buildKnexReadConfiguration(): Knex.Config {
  return {
    client: 'pg',
    connection: Configuration.databaseReadUrl,
    searchPath: [Configuration.databaseSchema],
    pool: {
      min: Configuration.databaseReadMinPool,
      max: Configuration.databaseReadMaxPool,
    },
  }
}
