#!/usr/bin/env node

import 'dotenv/config'
import { resolve as _resolve } from 'path'
import fs from 'fs'
import path from 'path'

import {
  downloadFile,
  getAllFilesMeta,
  getCMSAuthToken,
  getCollections,
  getCollectionItemsAsCsv,
  getConfigFromStdin,
  readFileAsync,
} from '../utils.mjs'

const handleError = (error) => error && console.error(error)

async function exportCollectionToCsv(exportDir, collection, token) {
  console.time(`Exporting "${collection}"`)
  const csvData = await getCollectionItemsAsCsv(collection, token)
  if (csvData) {
    const filename = path.join(exportDir, `${collection}.csv`)
    await fs.writeFile(filename, csvData, handleError)
    console.timeEnd(`Exporting "${collection}"`)
  } else {
    console.log(`Skipping empty collection "${collection}"`)
  }
}

async function main(args) {
  console.time('Export')
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

  // create export directory
  const exportDir = _resolve('./scripts/export-data/export')
  console.log(`Creating export directory at ${exportDir}`)
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir)
  }
  
  // create files directory
  const filesDir = _resolve('./scripts/export-data/export/files')
  console.log(`Creating export directory at ${filesDir}`)
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir)
  }

  const files = await getAllFilesMeta(token)
  console.log(`Found ${files.length} files`)
  console.log(files)

  for(const file of files) {
    const fileData = await downloadFile(file.id, token)
    await fs.writeFile(
      path.join(filesDir,file.filename_disk), 
      fileData,
      'binary',
      handleError,
    )
  }
  
  // Create a file for each collection
  const collections = await getCollections(token)
  await Promise.all(collections.map(collection => exportCollectionToCsv(exportDir, collection, token)))
  console.timeEnd('Export')
}

main(process.argv)
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
