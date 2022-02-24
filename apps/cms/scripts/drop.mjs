#!/usr/bin/env node

import 'dotenv/config'
import Knex from 'knex'
import { readlineAsync } from './utils.mjs'

const dbUrl = new URL(process.env.DB_CONNECTION_STRING)

const knex = Knex({
  client: 'pg',
  connection: `${dbUrl.origin}/postgres`,
  searchPath: process.env.DB_SEARCH_PATH,
})

async function main() {
  console.log(
    'This operation will drop your CMS database. Are you sure you want to proceed?'
  )
  if ((await readlineAsync('> y/N: ')) !== 'y') {
    console.log('Operation canceled.')
    process.exit(0)
  }
  const dbName = dbUrl.pathname.substring(1)
  await knex.raw(`DROP DATABASE IF EXISTS "${dbName}";`)
  await knex.raw(`CREATE DATABASE "${dbName}";`)
  console.log('Done!')
}

main(process.argv)
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => {
    return knex.destroy()
  })
