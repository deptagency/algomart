import { Knex } from 'knex'
import path from 'node:path'

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

export const testDatabase = 'test_api_database'

export function getTestDatabaseConfig(database?: string): Knex.Config {
  return {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: path.join(__dirname, `${database || testDatabase}.sqlite`),
    },
    migrations: {
      directory: path.join(__dirname, '..', 'src', 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '..', 'src', 'seeds'),
    },
  }
}
