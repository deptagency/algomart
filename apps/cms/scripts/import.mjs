#!/usr/bin/env node

import 'dotenv/config'

import Canvas from 'canvas'
import FormData from 'form-data'
import { createReadStream, writeFileSync } from 'fs'
import Knex from 'knex'
import { resolve as _resolve } from 'path'

import {
  checkAndUpdateCsvAsync,
  createAssetRecords,
  getCMSAuthToken,
  getConfigFromStdin,
  groupFilesFromDirectoryByExtension,
  importDataFile,
  readFileAsync,
  removeFile,
} from './utils.mjs'

const knex = Knex({
  client: 'pg',
  connection: process.env.DB_CONNECTION_STRING,
  searchPath: process.env.DB_SEARCH_PATH,
})

async function makeImage({
  width = 1024,
  height = 1024,
  text = 'Placeholder',
  filename = 'image.png',
  color = '#ffffff',
  backgroundColor = '#000000',
  font = 'bold 64px Arial',
  lineWidth = 16,
  borderColor,
  token,
} = {}) {
  const canvas = Canvas.createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)
  ctx.strokeStyle = borderColor || color
  ctx.lineWidth = lineWidth
  ctx.strokeRect(24, 24, width - 48, height - 48)

  const formData = new FormData()
  formData.append('title', text)
  formData.append('file', canvas.toBuffer(), { filename })

  return await createAssetRecords(formData, token)
}

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
  .finally(() => {
    return knex.destroy()
  })
