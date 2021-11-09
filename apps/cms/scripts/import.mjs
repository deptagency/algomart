#!/usr/bin/env node

import 'dotenv/config'

import FormData from 'form-data'
import { createReadStream, writeFileSync } from 'fs'
import { resolve as _resolve } from 'path'

import {
  checkAndUpdateCsvAsync,
  getCMSAuthToken,
  getConfigFromStdin,
  groupFilesFromDirectoryByExtension,
  importDataFile,
  readFileAsync,
  removeFile,
} from './utils.mjs'

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
  const token = await getCMSAuthToken(config)

  /**
   * Begin importing data.
   */

  const basePath = './scripts/import-data'
  const files = await groupFilesFromDirectoryByExtension(basePath, 'csv')
  // Loop through the import data
  for (const file of files) {
    const csvFile = _resolve(`${basePath}/${file}`)
    const collection = file.split('.').shift()
    console.log(`Checking file data for ${collection}...`)
    // Check validaity and add images in CSV file.
    const selectImages = ['preview_image']
    const data = await checkAndUpdateCsvAsync(csvFile, collection, selectImages, token)
    const formData = new FormData()
    const jsonFile = `${basePath}/${collection}.json`
    // Create JSON file
    writeFileSync(jsonFile, JSON.stringify(data))
    console.log('json:', jsonFile)
    formData.append('file', createReadStream(jsonFile))
    // Import data to CMS
    console.log(`Importing file for ${collection}...`)
    await importDataFile(formData, collection, token)
    // Remove newly created JSON file
    await removeFile(jsonFile)
  }

  console.log('Done!')
}

main(process.argv)
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
