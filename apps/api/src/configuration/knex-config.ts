import { Knex } from 'knex'

import { Configuration } from '.'

export default function buildKnexConfiguration(): Knex.Config {
  return {
    client: 'pg',
    connection: Configuration.databaseConnection,
    searchPath: [Configuration.databaseSchema],
    pool: {
      min: Configuration.databaseMainMinPool,
      max: Configuration.databaseMainMaxPool,
    },
  }
}
