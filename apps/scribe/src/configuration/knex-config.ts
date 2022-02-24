import { Knex } from 'knex'
import path from 'node:path'

import { Configuration } from '.'

export function buildKnexMainConfiguration(): Knex.Config {
  return {
    client: 'pg',
    connection: Configuration.databaseMainUrl,
    searchPath: [Configuration.databaseSchema],
    pool: { min: 2, max: 20 },
    migrations: {
      extension: 'ts',
      directory: path.join(__dirname, '..', 'migrations'),
    },
  }
}
