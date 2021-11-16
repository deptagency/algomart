#!/usr/bin/env node

import 'dotenv/config'

import { resolve as _resolve } from 'path'
import fs from 'fs'

import {
  createCsvFile,
  exportFieldsForCollection,
  getCMSAuthToken,
  getCollections,
  getConfigFromStdin,
  readFileAsync,
} from '../utils.mjs'

async function main(args) {
  /**
   * Read config file if it exists, or ask user to provide it.
   * Once credentials are provided, get an auth token from directus.
   */
  console.log('Authenticating...')
  let config = { email: '', password: '' }
  if (args.length < 3) {
    config = await getConfigFromStdin()
  } else {
    config = JSON.parse(await readFileAsync(_resolve(args[2])))
  }

  // Create "starters" directory in ./scripts/import-data if it doesn't exist
  const startersDir = _resolve('./scripts/import-data/starters')
  const imagesDir = _resolve('./scripts/import-data/images')
  if (!fs.existsSync(startersDir)) {
    fs.mkdirSync(startersDir)
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir)
  }

  /**
   * Begin creating starter files.
   */
  const token = await getCMSAuthToken(config)
  console.log('Beginning process to create starter files...')
  const collections = await getCollections(token)
  const basePath = './scripts/import-data/starters/'
  // Loop through all collections and create file.
  for (const collection of collections) {
    console.log(`Creating starter file for ${collection}...`)
    // Retrieve field schema for collection
    const fields = await exportFieldsForCollection(collection, token)
    // Create CSV file for collection
    await createCsvFile(basePath, collection, fields)
  }

  console.log('Done!')
}

main(process.argv)
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
