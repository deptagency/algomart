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

// fields to export for each collection (empty implies all fields)
const collectionFields = {
  // excluded: "user_created","date_created","user_updated","date_updated","translations"
  rarities: ["id","code","color"],
  rarities_translations: [],

  // excluded: "user_created","date_created","user_updated","date_updated","homepage","translations","nft_templates"
  pack_templates: ["id","status","sort","slug","type","price","released_at","auction_until","show_nfts","nft_order","nft_distribution","nfts_per_pack","pack_image","allow_bid_expiration","one_pack_per_customer","additional_images"],
  pack_templates_translations: [],

  // excluded: "user_created","date_created","user_updated","date_updated","homepage","translations""
  nft_templates: ["id","status","total_editions","unique_code","preview_image","preview_video","preview_audio","asset_file","pack_template","rarity","set","collection"],
  nft_templates_translations: [],

  // excluded: "user_created","date_created","user_updated","date_updated","translations","sets","nft_templates"
  collections: ["id","status","sort","slug","collection_image","reward_image"],
  collections_translations: [],

  // excluded: "user_created","date_created","user_updated","date_updated","translations","nft_templates"
  sets: ["id","status","sort","slug","collection"],
  sets_translations: [],
}

const handleError = (error) => error && console.error(error)

async function exportCollectionToCsv(exportDir, collection, token) {
  console.time(`Exporting "${collection}"`)
  const csvData = await getCollectionItemsAsCsv(collection, collectionFields[collection], token)
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
  const exportDir = _resolve('./scripts/export')
  console.log(`Creating export directory at ${exportDir}`)
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir)
  }
  
  // create files directory
  const filesDir = _resolve('./scripts/export/files')
  console.log(`Creating export directory at ${filesDir}`)
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir)
  }

  const files = await getAllFilesMeta(token)
  console.log(`Found ${files.length} asset files`)

  for (const file of files) {
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
