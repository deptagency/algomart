#!/usr/bin/env node

import 'dotenv/config'

import Knex from 'knex'
import { resolve as _resolve } from 'path'

import {
  execCommandAndGetOutput,
  getConfigFromStdin,
  readFileAsync,
} from './utils.mjs'

const knex = Knex({
  client: 'pg',
  connection: process.env.DB_CONNECTION_STRING,
  searchPath: process.env.DB_SEARCH_PATH,
})

async function main(args) {
  console.log('===== Bootstrap CMS =====')
  let config = { email: '', password: '' }

  if (args.length < 3) {
    config = await getConfigFromStdin()
  } else {
    config = JSON.parse(await readFileAsync(_resolve(args[2])))
  }

  if (process.env.DB_SEARCH_PATH) {
    console.log('Ensure schema is created...')
    await knex.raw(
      `CREATE SCHEMA IF NOT EXISTS "${process.env.DB_SEARCH_PATH}"`
    )
  }

  console.log('Bootstrapping Directus...')
  await execCommandAndGetOutput('npx directus bootstrap --skipAdminInit')
  const usersCount = await execCommandAndGetOutput(
    'npx directus count directus_users'
  )
  if (Number.parseInt(usersCount, 10) < 1) {
    console.log('Creating initial admin user...')
    const adminRoleId = await execCommandAndGetOutput(
      'npx directus roles create --role Admin --admin'
    )
    await execCommandAndGetOutput(
      `npx directus users create --email ${config.email} --password ${config.password} --role ${adminRoleId}`
    )
  }
  console.log('Done.')
}

main(process.argv)
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => {
    return knex.destroy()
  })
