import { Knex } from 'knex'

import { Configuration } from '.'

export default function buildKnexConfiguration(): Knex.Config {
  return {
    client: 'pg',
    connection: Configuration.databaseUrl,
    searchPath: [Configuration.databaseSchema],
  }
}
