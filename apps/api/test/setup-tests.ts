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
    client: 'postgres',
    useNullAsDefault: true,
    connection: `postgres://postgres:postgres@localhost:6543/${database}`,
    migrations: {
      directory: path.join(__dirname, '..', 'src', 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '..', 'src', 'seeds'),
    },
  }
}

export async function setupTestDatabase(database: string) {
  const baseKnex = Knex(getTestDatabaseConfig('algomart-api-test'))
  let knex: KnexInstance
  try {
    await baseKnex.raw(`CREATE DATABASE "${database}"`)
    knex = Knex(getTestDatabaseConfig(database))
    await knex.migrate.latest()
    await knex.seed.run()
  } finally {
    await baseKnex.destroy()
    if (knex) {
      await knex.destroy()
    }
  }
}

export async function teardownTestDatabase(database: string) {
  const knex = Knex(getTestDatabaseConfig('algomart-api-test'))
  try {
    await knex.raw(`DROP DATABASE "${database}"`)
  } catch (error) {
    await knex.destroy()
    console.log(error)
    throw error
  }
}
