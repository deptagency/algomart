#!/usr/bin/env node

import 'dotenv/config'

import FormData from 'form-data'
import fs from 'fs'
import path, { resolve as _resolve } from 'path'
import os from 'os'

import {
  createAssetRecords,
  getCMSAuthToken,
  getConfigFromStdin,
  importCsvFile,
  readFileAsync,
} from './utils.mjs'

const orderedCollectionsForImport = [
  'collections',
  'collections_translations',
  'sets',
  'sets_translations',
  'rarities',
  'rarities_translations',
  'pack_templates',
  'pack_templates_translations',
  'nft_templates',
  'nft_templates_translations',
]

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

  // Upload all asset files
  console.time('Upload assets')
  const basePath = './scripts/export'
  const assetsPath = path.join(basePath, 'files')
  const assetFiles = fs.readdirSync(assetsPath)
  // a map from old asset ids to new asset ids
  const assetMap = {}
  for (const filename of assetFiles) {
    if (!filename.startsWith('.')) {
      const formData = new FormData()
      formData.append('title', filename)
      const file = fs.createReadStream(_resolve(assetsPath, filename))
      formData.append('file', file)
      const fileMeta = await createAssetRecords(formData, token)
      const id = path.parse(filename).name
      assetMap[id] = fileMeta.id
    }
  }
  console.timeEnd('Upload assets')

  // Import CSVs
  console.time('Import CSVs')
  for (const collection of orderedCollectionsForImport) {
    const file = collection + '.csv'
    if (!fs.existsSync(path.join(basePath, file))) {
      continue
    }

    // Replace asset ids with new ones
    const csvFile = _resolve(path.join(basePath, file))
    let data = fs.readFileSync(csvFile).toString()
    Object.keys(assetMap).forEach((id) => {
      data = data.replaceAll(id, assetMap[id])
    })
    fs.writeFileSync(path.join(os.tmpdir(), file), data)

    const formData = new FormData()
    formData.append('file', fs.createReadStream(path.join(os.tmpdir(), file)))
    console.log(`Importing "${collection}"`)
    await importCsvFile(formData, collection, token)
  }

  console.log('Done!')
}

main(process.argv).catch((error) => {
  console.error(error)
  process.exit(1)
})
