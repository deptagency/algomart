import Knex, { Knex as KnexInstance } from 'knex'
import fs from 'node:fs'
import path from 'node:path'

const migrationsPath = path.resolve('apps', 'scribe', 'src', 'migrations')

const seedsPath = path.resolve('apps', 'api', 'src', 'seeds')

for (const file of fs.readdirSync(migrationsPath)) {
  require(path.resolve(migrationsPath, file))
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
      directory: migrationsPath,
    },
    seeds: {
      directory: seedsPath,
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
