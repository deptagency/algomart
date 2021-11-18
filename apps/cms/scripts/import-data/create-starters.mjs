#!/usr/bin/env node

import 'dotenv/config'

import path from 'path'
import fs from 'fs'

import {
  getFieldsForCollection,
  getCMSAuthToken,
  getCollections,
  getConfigFromStdin,
  readFileAsync,
} from '../utils.mjs'

/** 
 * Create a CSV file for the given collection at [basePath]/[collection].csv
 * with the given fields as headers.
 */
 export async function createCsvStarterFile(collection, basePath, token) {
  const fields = await getFieldsForCollection(collection, token)
  const headers = fields.map(field => field.name).join(',') + '\n'
  const filename = path.join(basePath, `${collection}.csv`)
  const handleError = (error) => error && console.error(error)
  await fs.writeFile(filename, headers, handleError)
}

async function main(args) {
  console.time('Create starter files')
  /**
   * Read config file if it exists, or ask user to provide it.
   * Once credentials are provided, get an auth token from directus.
   */
  console.log('Authenticating...')
  let config = { email: '', password: '' }
  if (args.length < 3) {
    config = await getConfigFromStdin()
  } else {
    config = JSON.parse(await readFileAsync(path.resolve(args[2])))
  }
  const token = await getCMSAuthToken(config)

  // Create "starters" directory in ./scripts/import-data if it doesn't exist
  const startersDir = path.resolve('./scripts/import-data/starters')
  if (!fs.existsSync(startersDir)) {
    fs.mkdirSync(startersDir)
  }
  const imagesDir = path.resolve('./scripts/import-data/images')
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir)
  }

  // Create starter files for each collection
  const collections = await getCollections(token)
  await Promise.all(collections.map(collection => createCsvStarterFile(collection, startersDir, token)))
  console.timeEnd('Create starter files')
}

main(process.argv)
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
