import Knex from 'knex'

export function configureKnex() {
  const databaseConfig = {
    client: 'pg',
    searchPath: process.env.DB_SEARCH_PATH,
  }

  if (process.env.DB_USE_SSL) {
    databaseConfig.connection = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT,
      ssl: {
        ca: process.env.DB_ROOT_CERT.toString()
      }
    }
  } else {
    databaseConfig.connection = process.env.DB_CONNECTION_STRING
  }

  return Knex( databaseConfig );
}
