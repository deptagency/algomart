import Knex from 'knex'

export function configureKnex() {
  return Knex({
    client: 'pg',
    connection: process.env.DB_CONNECTION_STRING,
    searchPath: process.env.DB_SEARCH_PATH,
  })
}
