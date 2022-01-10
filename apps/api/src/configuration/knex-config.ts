import { Knex } from 'knex'
import path from 'node:path'

import { Configuration } from '.'

export default function buildKnexConfiguration(): Knex.Config {
  return {
    client: 'pg',
    connection: Configuration.databaseUrl,
    searchPath: [Configuration.databaseSchema],
    migrations: {
      directory: path.join(__dirname, '..', 'migrations'),
    },
  }
}
