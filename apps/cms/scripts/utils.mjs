#!/usr/bin/env node

import axios from 'axios'
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline'
import * as stream from 'node:stream'
import csvParser from 'csv-parser'
import csvWriter from 'csv-write-stream'
import FormData from 'form-data'
import PureImage from 'pureimage'

/** Group flat array into a multi-dimensional array of N items. */
export function chunkArray(array, chunkSize) {
  return Array.from(new Array(Math.ceil(array.length / chunkSize)), (_, i) =>
    array.slice(i * chunkSize, i * chunkSize + chunkSize)
  )
}

/**
 * Post CMS assets to CMS DB
 * @param {FormData} formData
 * @param {import('@directus/sdk').Directus} directus
 */
export async function createAssetRecords(formData, directus) {
  const token = await directus.auth.token

  try {
    // Manually using Axios...
    const res = await axios.post(
      `${process.env.PUBLIC_URL}/files?access_token=${token}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...formData.getHeaders(),
        },
      }
    )
    return res.data.data
  } catch (error) {
    console.log(error.response?.data?.errors)
    process.exit(1)
  }
}

/** Prompt individual CLI user input. */
export function readlineAsync(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

export function registerFonts() {
  PureImage.registerFont(
    path.resolve('scripts/seed-data/Inter.ttf'),
    'Inter'
  ).loadSync()
}

export function streamToBuffer() {
  let chunks = []
  let buffer = null

  const writableStream = new stream.Writable({
    write(chunk, _encoding, next) {
      chunks.push(chunk)
      next()
    },
  })

  writableStream.on('finish', () => {
    buffer = Buffer.concat(chunks)
  })

  const getBuffer = () => {
    return new Promise((resolve) => {
      const tick = () => {
        setImmediate(() => {
          if (buffer) resolve(buffer)
          else tick()
        })
      }

      tick()
    })
  }

  return { writableStream, getBuffer }
}

export async function makeImage({
  width = 1024,
  height = 1024,
  text = 'Placeholder',
  filename = 'image.png',
  color = '#ffffff',
  backgroundColor = '#000000',
  font = '64px Inter',
  lineWidth = 16,
  borderColor,
  directus,
} = {}) {
  const canvas = PureImage.make(width, height)
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
  const { getBuffer, writableStream } = streamToBuffer()

  PureImage.encodePNGToStream(canvas, writableStream)

  const formData = new FormData()
  formData.append('title', text)
  formData.append('file', await getBuffer(), { filename })

  return await createAssetRecords(formData, directus)
}

export async function makeVideo({
  directus
} = {}) {
  const data = fs.readFileSync(path.resolve('scripts/seed-data/clip.mp4'))

  const formData = new FormData()
  formData.append('title', 'preview video')
  formData.append('file', data, { filename: 'preview-video.webm' })

  return await createAssetRecords(formData, directus)
}
// #region Import/Export Utils

/**
 * Abstraction to look up a directus record by a unique attribute (e.g. a slug) and get its id
 */
export async function getEntityIdByUniqueAttr({
  attrKey,
  attrVal,
  directus,
  entityName,
  map,
}) {
  attrVal = sanitizeString(attrVal)
  if (!attrVal || !attrVal) return null
  if (map.get(attrVal)) {
    return map.get(attrVal)
  }
  const items = await directus.items(entityName).readByQuery({
    fields: ['id'],
    filter: { [attrKey]: { _eq: attrVal } },
    limit: 1,
  })
  if (!items.data.length) {
    throw new Error(`Unknown ${attrKey} ${attrVal} in ${entityName}`)
  }
  const itemId = items.data[0].id
  map.set(attrVal, itemId)
  return itemId
}

/**
 * Generate a unique but predicatable filename for output results
 */
export function getOutputFilename(file) {
  return `IMPORT-${path.basename(file, '.csv')}-results-${getTimestamp()}.csv`
}

/**
 * Get UTC timestamp in seconds
 *
 * Used for generating the filename of the output result
 */
export function getTimestamp() {
  const now = new Date()
  const utcMilllisecondsSinceEpoch =
    now.getTime() + now.getTimezoneOffset() * 60 * 1000
  return Math.round(utcMilllisecondsSinceEpoch / 1000)
}

/**
 * Import publicly accessible file via URL into directus
 */
export async function importFile(directus, url = '', title = '') {
  if (!url) return null
  try {
    const file = await directus.files.import({
      url: sanitizeString(url),
      data: { title: sanitizeString(title) },
    })
    return file?.id || null
  } catch (error) {
    throw new Error(error.message)
  }
}

/**
 * Take a readstream and process its rows via a callback in concurrent batches
 *
 * This can speed up the time of the import process * batchSize rather than
 * import sequentially one at a time
 */
export async function handleCvsBatching(readStream, callback, batchSize = 50) {
  let pendingRows = []
  for await (const row of readStream) {
    pendingRows.push(row)
    if (pendingRows.length === batchSize) {
      await Promise.all(
        pendingRows.map(async (row) => {
          await callback(row)
        })
      )
      pendingRows = []
    }
  }
  if (pendingRows.length) {
    await Promise.all(
      pendingRows.map(async (row) => {
        await callback(row)
      })
    )
  }
}

/**
 * Parse 'true' or 'false' into boolean if provided, otherwise return null
 */
export function sanitizeBoolean(str, fieldName) {
  const trimmed = str.trim().toLowerCase()
  if (!trimmed) return null
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  throw new Error(`Invalid boolean value of ${str} for ${fieldName}.`)
}

/**
 * Convert a float currency into an integer if provided, otherwise return null
 * NOTE: This might need to be adjusted to match the application's default currency if not USD
 */
export function sanitizeCurrency(str, fieldName) {
  const trimmed = str.trim()
  if (!trimmed) return null
  const value = parseInt(parseFloat(trimmed) * 100)
  if (Number.isNaN(value)) {
    throw new Error(`Invalid currency value of ${str} for ${fieldName}.`)
  }
  return value
}

/**
 * Validate a value from a set of enums if provided, otherwise return null
 */
export function sanitizeEnum(str, options, fieldName) {
  const trimmed = str.toLowerCase().trim()
  if (!trimmed) return null
  if (options.includes(trimmed)) return trimmed
  throw new Error(`Invalid value of ${str} for ${fieldName}.`)
}

/**
 * Validate an integer if provided, otherwise return null
 */
export function sanitizeInteger(str, fieldName) {
  const trimmed = str.trim()
  if (!trimmed) return null
  const value = parseInt(trimmed)
  if (typeof value !== 'number')
    throw new Error(`Invalid number value of ${str} for ${fieldName}.`)
  return value
}

/**
 * Validate a timestamp if provided, otherwise return null
 */
export function sanitizeTimestamp(str, fieldName) {
  const trimmed = str.trim()
  if (!trimmed) return null
  if (Number.isNaN(Date.parse(trimmed))) {
    throw new Error(`Invalid timestamp value of ${str} for ${fieldName}.`)
  }
  return trimmed
}

/**
 * Return a trimmed string (or null if if falsy)
 */
export function sanitizeString(str) {
  const trimmed = str.trim()
  return trimmed ?? null
}

/**
 * Set up read and write streams for import parsing and ouput reporting
 */
export async function setupStreams(file) {
  const outputFilename = getOutputFilename(file)

  // Setup write stream to output results
  const writeStream = csvWriter()
  await writeStream.pipe(fs.createWriteStream(outputFilename))

  // Set up read stream to parse csv
  const readStream = fs.createReadStream(file).pipe(csvParser())
  return {
    outputFilename,
    readStream,
    writeStream,
  }
}
// #endregion
