import 'tsconfig-paths/register'

import Knex from 'knex'
import fs from 'node:fs'
import path from 'node:path'

import { getTestDatabaseConfig, testDatabase } from './setup-tests'

const migrationPaths = path.resolve(__dirname, '..', 'src', 'migrations')
for (const file of fs.readdirSync(migrationPaths)) {
  require(path.resolve(migrationPaths, file))
}

require('@/seeds/seed-test-data')

async function seedTestDatabase() {
  const knex = Knex(getTestDatabaseConfig(testDatabase))
  try {
    await knex.migrate.latest()
    await knex.seed.run()
  } finally {
    await knex.destroy()
  }
}

export default async function globalSetup() {
  try {
    await seedTestDatabase()
  } catch (error) {
    console.error(error)
    throw error
  }
}
