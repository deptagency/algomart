import Knex, { Knex as KnexInstance } from 'knex'
import fs from 'node:fs'
import path from 'node:path'

const migrationPaths = path.resolve(__dirname, '..', 'src', 'migrations')
for (const file of fs.readdirSync(migrationPaths)) {
  require(path.resolve(migrationPaths, file))
}

require('../src/seeds/seed-test-data')

/**
 * Generate fake Algorand Account address and Algorand Transaction ID
 */
export function fakeAddressFor(type: 'account' | 'transaction') {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const size = type === 'account' ? 58 : 52
  const result = []
  while (result.length < size) {
    result.push(alphabet[Math.floor(Math.random() * alphabet.length)])
  }

  return result.join('')
}

export function getTestDatabaseConfig(database: string): KnexInstance.Config {
  return {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: path.join(__dirname, `${database}.sqlite`),
    },
    migrations: {
      directory: path.join(__dirname, '..', 'src', 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '..', 'src', 'seeds'),
    },
  }
}

export async function setupTestDatabase(database: string) {
  const knex = Knex(getTestDatabaseConfig(database))
  try {
    await knex.migrate.latest()
    await knex.seed.run()
  } finally {
    await knex.destroy()
  }
}

export async function teardownTestDatabase(database: string) {
  try {
    const config = getTestDatabaseConfig(database)
    const connection = config.connection as KnexInstance.Sqlite3ConnectionConfig
    if (connection?.filename) {
      fs.unlinkSync(connection.filename)
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}
