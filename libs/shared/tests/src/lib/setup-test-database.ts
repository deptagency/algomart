import Knex, { Knex as KnexInstance } from 'knex'
import fs from 'node:fs'
import path from 'node:path'

const migrationsPath = path.resolve('apps', 'scribe', 'src', 'migrations')

// const seedsPath = path.resolve('libs', 'shared', 'tests', 'src', 'lib')

for (const file of fs.readdirSync(migrationsPath)) {
  require(path.resolve(migrationsPath, file))
}

export function getTestDatabaseConfig(database = ''): KnexInstance.Config {
  return {
    client: 'postgres',
    useNullAsDefault: true,
    connection: process.env.TEST_DATABASE_URL_PREFIX
      ? process.env.TEST_DATABASE_URL_PREFIX + database
      : `postgres://postgres:postgres@test_db:5432/${database}`,
    migrations: {
      directory: migrationsPath,
    },
  }
}

export async function setupTestDatabase(
  database: string,
  { returnKnex = true } = {}
) {
  const baseKnex = Knex(getTestDatabaseConfig())
  let knex: KnexInstance
  try {
    await baseKnex.raw(`DROP DATABASE IF EXISTS "${database}"`)
    await baseKnex.raw(`CREATE DATABASE "${database}"`)
    knex = Knex(getTestDatabaseConfig(database))
    await knex.migrate.latest()
  } catch (error) {
    console.error(`Error while initializing test db: ${database}`, error)
  } finally {
    await baseKnex.destroy()
    if (!returnKnex) {
      await knex.destroy()
    }
  }
  return returnKnex ? knex : undefined
}

export async function teardownTestDatabase(
  database: string,
  knex?: KnexInstance
) {
  if (knex) {
    await knex.destroy()
  }
  const baseKnex = Knex(getTestDatabaseConfig())
  try {
    await baseKnex.raw(`DROP DATABASE IF EXISTS "${database}"`).then()
    await baseKnex.destroy()
  } catch (error) {
    await baseKnex.destroy()
    throw error
  }
}
