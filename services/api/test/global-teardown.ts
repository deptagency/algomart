import { Knex } from 'knex'
import fs from 'node:fs'

import { getTestDatabaseConfig } from './setup-tests'

export default async function globalTeardown() {
  try {
    const config = getTestDatabaseConfig()
    const connection = config.connection as Knex.Sqlite3ConnectionConfig
    if (connection?.filename) {
      fs.unlinkSync(connection.filename)
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}
