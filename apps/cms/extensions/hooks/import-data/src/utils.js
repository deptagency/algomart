import axios from 'axios'
import { toArray } from '@directus/shared/utils'
import formatTitle from '@directus/format-title'

import { lookup } from 'node:dns'
import { promisify } from 'node:util'
import url, { URL } from 'node:url'
import net from 'node:net'
import path from 'node:path'

const lookupDNS = promisify(lookup)

/**
 * Return a trimmed string (or null if falsy)
 */
export function sanitizeString(str) {
  const trimmed = str.trim()
  return trimmed ?? null
}

/**
 * Take a readstream and process its rows via a callback in concurrent batches
 *
 * This can speed up the time of the import process * batchSize rather than
 * import sequentially one at a time
 */
export async function handleCsvBatching(readStream, callback, batchSize = 50) {
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
 * Import publicly accessible file via URL into directus
 */
export async function importFile(url = '', title = '', fileService) {
  if (!url) return null
  try {
    //returns the id of the newly created file
    return await fileService.importOne(sanitizeString(url), {
      title: sanitizeString(title),
    })
  } catch (error) {
    throw new Error(error.message)
  }
}

/**
 * Replace existing file in directus with a new one
 * @param directusFileId Primary key of existing file in directus
 * @param remoteFileUrl URL of new file
 * @param fileService File service instance
 * @return The id of the updated file
 */
export async function replaceFile(directusFileId, remoteFileUrl, fileService) {
  if (!directusFileId || !remoteFileUrl) return null

  let resolvedUrl
  try {
    resolvedUrl = new URL(remoteFileUrl)
  } catch (err) {
    console.warn(err, `Requested URL ${remoteFileUrl} isn't a valid URL`)
    throw new Error(
      `Couldn't fetch file from url "${remoteFileUrl}" for file ${directusFileId}`
    )
  }

  let ip = resolvedUrl.hostname

  if (net.isIP(ip) === 0) {
    try {
      ip = (await lookupDNS(ip)).address
    } catch (err) {
      console.warn(err, `Couldn't lookup the DNS for url ${remoteFileUrl}`)
      throw new Error(
        `Couldn't fetch file from url "${remoteFileUrl}" for file ${directusFileId}`
      )
    }
  }

  let fileResponse

  try {
    fileResponse = await axios.get(remoteFileUrl, {
      responseType: 'stream',
    })
  } catch (err) {
    console.warn(err, `Couldn't fetch file from url "${remoteFileUrl}"`)
    throw new Error(
      `Couldn't fetch file from url "${remoteFileUrl}" for file ${directusFileId}`
    )
  }

  const parsedURL = url.parse(fileResponse.request.res.responseUrl)
  const filename = path.basename(parsedURL.pathname)

  const payload = {
    filename_download: filename,
    storage: toArray(process.env.STORAGE_LOCATIONS)[0],
    type: fileResponse.headers['content-type'],
    title: formatTitle(filename),
  }

  try {
    const updatedKey = await fileService.uploadOne(
      fileResponse.data,
      payload,
      directusFileId
    )

    return updatedKey
  } catch (error) {
    throw new Error(error.message)
  }
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
 * Convert a float currency into an integer if provided, otherwise return null
 * NOTE: No currency adjustments needed, all is USDC Credits
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
 * Abstraction to look up a directus record by a unique attribute (e.g. a slug) and get its id
 */
export async function getEntityIdByUniqueAttr({
  attrKey,
  attrVal,
  itemService,
  entityName,
  map,
}) {
  attrVal = sanitizeString(attrVal)
  if (!attrVal || !attrVal) return null
  if (map.get(attrVal)) {
    return map.get(attrVal)
  }
  const items = await itemService.readByQuery({
    fields: ['id'],
    filter: { [attrKey]: { _eq: attrVal } },
    limit: 1,
  })
  if (!items.length) {
    throw new Error(`Unknown ${attrKey} ${attrVal} in ${entityName}`)
  }
  const itemId = items[0].id
  map.set(attrVal, itemId)
  return itemId
}

/**
 * Generate a unique but predicatable filename for output results
 */
export function getOutputFilename(file) {
  const filename = file.substring(0, file.lastIndexOf('.')) || file
  return `IMPORT-${filename}-results-${getTimestamp()}.csv`
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
 * If a preset for import_files doesn't exist we create one. This should only happen once and
 * provides the default collection display for import_files
 */
export async function createImportPreset(database, schema, PresetsService) {
  const presetService = new PresetsService({
    database: database,
    schema: schema,
  })
  const existingPreset = await presetService.readByQuery({
    filter: {
      _and: [
        { collection: { _eq: 'import_files' } },
        { role: { _null: true } },
        { user: { _null: true } },
      ],
    },
  })
  if (!existingPreset[0]) {
    const maxPresetId = await presetService.readByQuery({
      fields: ['id'],
      aggregate: { max: ['id'] },
    })
    let newPresetId = 1
    if (maxPresetId[0]) {
      newPresetId = maxPresetId[0].max.id + 1
    }
    await presetService.createOne({
      id: newPresetId,
      collection: 'import_files',
      layout: 'tabular',
      refresh_interval: 5,
      layout_query: {
        tabular: {
          page: 1,
          fields: [
            'entity_type',
            'import_file.title',
            'status',
            'has_errors',
            'date_updated',
            'num_processed',
          ],
          sort: ['-date_updated'],
        },
      },
      layout_options: {
        tabular: {
          widths: {
            status: 191.28,
          },
        },
      },
    })
  }
}
