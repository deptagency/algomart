#!/usr/bin/env node
import 'dotenv/config'

import { setupSDK, setAccessToken } from './directus.mjs'
import { configureKnex } from './knex.mjs'
import {
  getEntityIdByUniqueAttr,
  handleCvsBatching,
  importFile,
  sanitizeBoolean,
  sanitizeCurrency,
  sanitizeEnum,
  sanitizeInteger,
  sanitizeString,
  sanitizeTimestamp,
  setupStreams,
} from './utils.mjs'

const knex = configureKnex()

async function main([_node, _path, entity, file]) {
  // Configure Directus
  console.log('Configuring Directus SDK...')
  const directus = await setupSDK({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })
  await setAccessToken(directus, process.env.ADMIN_ACCESS_TOKEN)

  /**
   * NOTE: Due to the nature of CMS entity relationships, the following constraints apply:
   * - Collections must be imported before Sets.
   * - Sets must be imported before NFT Templates.
   * - Pack Templates must be imported before NFT Templates.
   * - Rarities must be imported before NFT templates.
   *
   * Therefore, the following order of import is recommended:
   * 1. Rarities
   * 2. Collections
   * 3. Sets
   * 4. Pack Templates
   * 5. NFT Templates
   */

  // Map to entitiy
  switch (entity) {
    case 'rarities':
      console.log('Importing rarities...')
      return await importRarities(directus, file)
    case 'collections':
      console.log('Importing collections...')
      return await importCollections(directus, file)
    case 'sets':
      console.log('Importing sets...')
      return await importSets(directus, file)
    case 'pack_templates':
      console.log('Importing pack_templates...')
      return await importPackTemplates(directus, file)
    case 'nft_templates':
      console.log('Importing nft_templates...')
      return await importNftTemplates(directus, file)
    default:
      console.warn(`No entities matched ${entity}.`)
  }
}

async function importRarities(directus, file) {
  // Set up streams to read input and to report output
  const { outputFilename, readStream, writeStream } = await setupStreams(file)

  const processRow = async (row) => {
    try {
      // Create rarity
      await directus.items('rarities').createOne({
        code: sanitizeString(row.CODE),
        color: sanitizeString(row.COLOR),
        translations: [
          {
            languages_code: 'en-UK',
            name: sanitizeString(row.TRANSLATIONS_EN_NAME),
          },
          {
            languages_code: 'es-ES',
            name: sanitizeString(row.TRANSLATIONS_ES_NAME),
          },
          {
            languages_code: 'fr-FR',
            name: sanitizeString(row.TRANSLATIONS_FR_NAME),
          },
        ],
      }).data
      writeStream.write({ ...row, IMPORT_RESULT: 'Success!' })
    } catch (error) {
      console.log(`Error writing Rarity with code ${row.CODE}.`)
      await writeStream.write({
        ...row,
        IMPORT_RESULT: `error: ${error.message}`,
      })
    }
  }

  // Process rows in batches
  await handleCvsBatching(readStream, processRow)

  await writeStream.end()
  console.log(`Rarities imported! See ${outputFilename} for details.`)
}

async function importCollections(directus, file) {
  // Set up streams to read input and to report output
  const { outputFilename, readStream, writeStream } = await setupStreams(file)

  const processRow = async (row) => {
    try {
      // Create collection
      await directus.items('collections').createOne({
        status: sanitizeString(row.STATUS),
        slug: await sanitizeString(row.SLUG),
        collection_image: await importFile(
          directus,
          row.COLLECTION_IMAGE_URL,
          row.SLUG
        ),
        reward_image: await importFile(
          directus,
          row.REWARD_IMAGE_URL,
          row.SLUG
        ),
        translations: [
          {
            languages_code: 'en-UK',
            name: sanitizeString(row.TRANSLATIONS_EN_NAME),
            description: sanitizeString(row.TRANSLATIONS_EN_DESCRIPTION),
            reward_prompt: sanitizeString(row.TRANSLATIONS_EN_REWARD_PROMPT),
            reward_complete: sanitizeString(
              row.TRANSLATIONS_EN_REWARD_COMPLETE
            ),
          },
          {
            languages_code: 'es-ES',
            name: sanitizeString(row.TRANSLATIONS_ES_NAME),
            description: sanitizeString(row.TRANSLATIONS_ES_DESCRIPTION),
            reward_prompt: sanitizeString(row.TRANSLATIONS_ES_REWARD_PROMPT),
            reward_complete: sanitizeString(
              row.TRANSLATIONS_ES_REWARD_COMPLETE
            ),
          },
          {
            languages_code: 'fr-FR',
            name: sanitizeString(row.TRANSLATIONS_FR_NAME),
            description: sanitizeString(row.TRANSLATIONS_FR_DESCRIPTION),
            reward_prompt: sanitizeString(row.TRANSLATIONS_FR_REWARD_PROMPT),
            reward_complete: sanitizeString(
              row.TRANSLATIONS_FR_REWARD_COMPLETE
            ),
          },
        ],
      }).data
      writeStream.write({ ...row, IMPORT_RESULT: 'Success!' })
    } catch (error) {
      console.log(`Error writing Collection with slug ${row.SLUG}.`)
      await writeStream.write({
        ...row,
        IMPORT_RESULT: `error: ${error.message}`,
      })
    }
  }

  // Process rows in batches
  await handleCvsBatching(readStream, processRow)

  await writeStream.end()
  console.log(`Collections imported! See ${outputFilename} for details.`)
}

async function importSets(directus, file) {
  // Set up streams to read input and to report output
  const { outputFilename, readStream, writeStream } = await setupStreams(file)

  // Set up relation to collections
  const collectionMap = new Map()

  const processRow = async (row) => {
    try {
      // Create set
      await directus.items('sets').createOne({
        status: sanitizeString(row.STATUS),
        slug: await sanitizeString(row.SLUG),
        collection: null,
        collection: await getEntityIdByUniqueAttr({
          attrKey: 'slug',
          attrVal: row.COLLECTION_SLUG,
          directus,
          entityName: 'collections',
          map: collectionMap,
        }),
        translations: [
          {
            languages_code: 'en-UK',
            name: sanitizeString(row.TRANSLATIONS_EN_NAME),
          },
          {
            languages_code: 'es-ES',
            name: sanitizeString(row.TRANSLATIONS_ES_NAME),
          },
          {
            languages_code: 'fr-FR',
            name: sanitizeString(row.TRANSLATIONS_FR_NAME),
          },
        ],
      }).data
      writeStream.write({ ...row, IMPORT_RESULT: 'Success!' })
    } catch (error) {
      console.log(`Error writing Set with slug ${row.SLUG}.`)
      await writeStream.write({
        ...row,
        IMPORT_RESULT: `error: ${error.message}`,
      })
    }
  }

  // Process rows in batches
  await handleCvsBatching(readStream, processRow)

  await writeStream.end()
  console.log(`Sets imported! See ${outputFilename} for details.`)
}

async function importPackTemplates(directus, file) {
  // Set up streams to read input and to report output
  const { outputFilename, readStream, writeStream } = await setupStreams(file)

  const processRow = async (row) => {
    try {
      // Create pack_template
      await directus.items('pack_templates').createOne({
        status: sanitizeString(row.STATUS),
        slug: sanitizeString(row.SLUG),
        type: sanitizeEnum(
          row.TYPE,
          ['auction', 'free', 'purchase', 'redeem'],
          'TYPE'
        ),
        price: sanitizeCurrency(row.PRICE, 'PRICE'),
        released_at: sanitizeTimestamp(row.RELEASED_AT, 'RELEASED_AT'),
        auction_until: sanitizeTimestamp(row.AUCTION_UNTIL, 'AUCTION_UNTIL'),
        show_nfts: sanitizeBoolean(row.SHOW_NFTS, 'SHOW_NFTS'),
        nft_order: sanitizeEnum(
          row.NFT_ORDER,
          ['match', 'random'],
          'NFT_ORDER'
        ),
        nft_distribution: sanitizeEnum(
          row.NFT_DISTRIBUTION,
          ['one-of-each', 'random'],
          'NFT_DISTRIBUTION'
        ),
        nfts_per_pack: sanitizeInteger(row.NFTS_PER_PACK, 'NFTS_PER_PACK'),
        one_pack_per_customer: sanitizeBoolean(
          row.ONE_PACK_PER_CUSTOMER,
          'ONE_PACK_PER_CUSTOMER'
        ),
        allow_bid_expiration: sanitizeBoolean(
          row.ALLOW_BID_EXPIRATION,
          'ALLOW_BID_EXPIRATION'
        ),
        pack_banner: await importFile(directus, row.PACK_BANNER_URL, row.SLUG),
        pack_image: await importFile(directus, row.PACK_IMAGE_URL, row.SLUG),
        translations: [
          {
            languages_code: 'en-UK',
            title: sanitizeString(row.TRANSLATIONS_EN_TITLE),
            subtitle: sanitizeString(row.TRANSLATIONS_EN_SUBTITLE),
            body: sanitizeString(row.TRANSLATIONS_EN_BODY),
          },
          {
            languages_code: 'es-ES',
            title: sanitizeString(row.TRANSLATIONS_ES_TITLE),
            subtitle: sanitizeString(row.TRANSLATIONS_ES_SUBTITLE),
            body: sanitizeString(row.TRANSLATIONS_ES_BODY),
          },
          {
            languages_code: 'fr-FR',
            title: sanitizeString(row.TRANSLATIONS_FR_TITLE),
            subtitle: sanitizeString(row.TRANSLATIONS_FR_SUBTITLE),
            body: sanitizeString(row.TRANSLATIONS_FR_BODY),
          },
        ],
      }).data
      writeStream.write({ ...row, IMPORT_RESULT: 'Success!' })
    } catch (error) {
      console.log(`Error writing Pack Template with slug ${row.SLUG}.`)
      await writeStream.write({
        ...row,
        IMPORT_RESULT: `error: ${error.message}`,
      })
    }
  }

  // Process rows in batches
  await handleCvsBatching(readStream, processRow)

  await writeStream.end()
  console.log(`Pack Templates imported! See ${outputFilename} for details.`)
}

async function importNftTemplates(directus, file) {
  // Set up streams to read input and to report output
  const { outputFilename, readStream, writeStream } = await setupStreams(file)

  // Set up relation to other entities
  const rarityMap = new Map()
  const packMap = new Map()
  const setMap = new Map()
  const collectionMap = new Map()

  const processRow = async (row) => {
    try {
      // Create nft_template
      await directus.items('nft_templates').createOne({
        status: sanitizeString(row.STATUS),
        pack_template: await getEntityIdByUniqueAttr({
          attrKey: 'slug',
          attrVal: row.PACK_TEMPLATE_SLUG,
          directus,
          entityName: 'pack_templates',
          map: packMap,
        }),
        set: await getEntityIdByUniqueAttr({
          attrKey: 'slug',
          attrVal: row.SET_SLUG,
          directus,
          entityName: 'sets',
          map: setMap,
        }),
        collection: await getEntityIdByUniqueAttr({
          attrKey: 'slug',
          attrVal: row.COLLECTION_SLUG,
          directus,
          entityName: 'collections',
          map: collectionMap,
        }),
        unique_code: sanitizeString(row.UNIQUE_CODE),
        total_editions: sanitizeInteger(row.TOTAL_EDITIONS, 'TOTAL_EDITIONS'),
        rarity: await getEntityIdByUniqueAttr({
          attrKey: 'code',
          attrVal: row.RARITY_CODE,
          directus,
          entityName: 'rarities',
          map: rarityMap,
        }),
        preview_image: await importFile(
          directus,
          row.PREVIEW_IMAGE_URL,
          row.UNIQUE_CODE
        ),
        preview_video: await importFile(
          directus,
          row.PREVIEW_VIDEO_URL,
          row.UNIQUE_CODE
        ),
        preview_audio: await importFile(
          directus,
          row.PREVIEW_AUDIO_URL,
          row.UNIQUE_CODE
        ),
        asset_file: await importFile(
          directus,
          row.ASSET_FILE_URL,
          row.UNIQUE_CODE
        ),
        translations: [
          {
            languages_code: 'en-UK',
            title: sanitizeString(row.TRANSLATIONS_EN_TITLE),
            subtitle: sanitizeString(row.TRANSLATIONS_EN_SUBTITLE),
            body: sanitizeString(row.TRANSLATIONS_EN_BODY),
          },
          {
            languages_code: 'es-ES',
            title: sanitizeString(row.TRANSLATIONS_ES_TITLE),
            subtitle: sanitizeString(row.TRANSLATIONS_ES_SUBTITLE),
            body: sanitizeString(row.TRANSLATIONS_ES_BODY),
          },
          {
            languages_code: 'fr-FR',
            title: sanitizeString(row.TRANSLATIONS_FR_TITLE),
            subtitle: sanitizeString(row.TRANSLATIONS_FR_SUBTITLE),
            body: sanitizeString(row.TRANSLATIONS_FR_BODY),
          },
        ],
      }).data
      writeStream.write({ ...row, IMPORT_RESULT: 'Success!' })
    } catch (error) {
      console.log(
        `Error writing NFT Template with unique code ${row.UNIQUE_CODE}.`
      )
      await writeStream.write({
        ...row,
        IMPORT_RESULT: `error: ${error.message}`,
      })
    }
  }

  // Process rows in batches
  console.time('NFT Templates imported in')
  await handleCvsBatching(readStream, processRow)
  console.timeEnd('NFT Templates imported in')

  await writeStream.end()
  console.log(`NFT Templates imported! See ${outputFilename} for details.`)
}

main(process.argv)
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => {
    return knex.destroy()
  })
