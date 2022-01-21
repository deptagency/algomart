import { Knex } from 'knex'
import path from 'node:path'

import { Configuration } from '.'

export default function buildKnexConfiguration(): Knex.Config {
  return {
    client: 'pg',
    connection: Configuration.databaseUrl,
    searchPath: [Configuration.databaseSchema],
    pool: { min: 2, max: 20 },
    migrations: {
      extension: 'ts',
      directory: path.join(__dirname, '..', 'migrations'),
    },
  }
}
