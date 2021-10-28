#!/usr/bin/env node

import 'dotenv/config'

import Canvas from 'canvas'
import FormData from 'form-data'
import Knex from 'knex'
import { resolve as _resolve } from 'path'

import { randColor } from './seed-data/color.mjs'
import { Factory } from './seed-data/factories.mjs'
import {
  chunkArray,
  createAssetRecords,
  createEntityRecords,
  getCMSAuthToken,
  getConfigFromStdin,
  readFileAsync,
  readlineAsync,
} from './utils.mjs'
import { updateEntityRecord } from './utils.mjs'

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
   * To prevent errors when seeding, it's best to start from a fresh DB.
   * Ask user to confirm the destructive operation, and if so, truncate the tables before seeding.                                                                                          [return description]
   */
  console.log(
    'This operation will overwrite any records in your database. Are you sure you want to proceed?'
  )
  if ((await readlineAsync('> y/N: ')) !== 'y') {
    console.log('Operation canceled.')
    process.exit(0)
  }
  await knex.raw(`TRUNCATE TABLE 
    directus_files,
    homepage,
    rarities, rarities_translations, 
    nft_templates, nft_templates_translations,
    pack_templates, pack_templates_translations, pack_templates_directus_files,
    collections, collections_translations,
    sets, sets_translations
    CASCADE`)

  /**
   * Read config file if it exists, or ask user to provide it.
   * Once credentials are provided, get an auth token from  directus.
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
   * Begin seeding data.
   */
  console.log('Seeding database...')

  /**
   * These numbers can be adjusted, just be mindful of the implications.
   * Disproportional values can break the cascade of how assets are divy'd up.
   * This can lead to empty packs/collections/sets, or might just error.
   * These numbers were chosen to create a reasonably balanced set of data.
   */
  const multiplier = 1 // Crank this up to create more of everything

  const numRarities = 3
  const numCollectibles = 48 * multiplier
  const numCollectiblesPerPack = 6
  const numCollections = 3
  const numCollectiblesPerSet = 4
  const rarityLikelihood = 10 // The bigger this number, the less chance of non-common items.

  /**
   * Create CMS collections records.
   * Order DOES matter here because of the various relationships of these entities.
   *
   * Order must be:
   * - Rarities
   * - Collectibles
   * - Packs
   * - Collections
   * - Sets
   */

  /**
   * Create homepage
   */
  const homepageFactory = Factory.build('homepage')
  const homepage = await updateEntityRecord(
    'homepage',
    '',
    homepageFactory,
    token
  )

  /**
   * Create rarities.
   */
  const rarityFactories = Factory.buildList('rarity', numRarities)
  const rarities = await createEntityRecords('rarities', rarityFactories, token)

  /**
   * Creates N collectibles with mixed rarities.
   */
  let notableCount = 0
  const collectibleFactories = await Promise.all(
    Factory.buildList('collectible', numCollectibles).map(async (item, i) => {
      const isNotable = notableCount < 8
      if (isNotable) {
        notableCount++
      }
      // Using rarityLikelihood will apply rarities to some of the items.
      const rarity = rarities[i % rarityLikelihood]
      item.rarity = rarity?.id || null // no rarity if null

      const previewImage = await makeImage({
        token,
        text: item.translations[0].title,
        color: '#000000',
        borderColor: rarity?.color || '#000000',
        backgroundColor: randColor(),
      })

      item.preview_image = previewImage.id

      item.homepage = isNotable ? homepage.id : null

      return item
    })
  )

  // Directus only supports 100 items per batch, so split them up into groups of 100
  const collectibles = []
  const collectibleChunks = chunkArray(collectibleFactories, 100)
  await Promise.all(
    collectibleChunks.map(async (group) => {
      const collectibleGroup = await createEntityRecords(
        'nft_templates',
        group,
        token
      )
      collectibles.push(...collectibleGroup)
    })
  )

  /**
   * Create N packs, each with numCollectiblesPerPack (where N = numCollectibles / numCollectiblesPerPack).
   * This distributes all of the collectibles evenly across packs.
   * Example: if we have 48 collectibles and we want 6 collectibles per pack, we'll have 8 packs.
   */
  const chunkedPacks = chunkArray(collectibles, numCollectiblesPerPack)
  let upcomingCount = 0
  const packFactories = await Promise.all(
    chunkedPacks.map(async (chunk) => {
      const color = randColor()
      const isUpcoming = upcomingCount < 6
      if (isUpcoming) {
        upcomingCount++
      }

      const pack = Factory.build('pack', {
        nfts_per_pack: numCollectiblesPerPack,
        nft_templates: chunk.map((item) => item.id),
        homepage: isUpcoming ? homepage.id : null,
      })

      const packImage = await makeImage({
        token,
        text: pack.translations[0].title,
        color: '#000000',
        backgroundColor: color,
      })

      pack.pack_image = packImage.id

      return pack
    })
  )
  const packTemplates = await createEntityRecords(
    'pack_templates',
    packFactories,
    token
  )
  await updateEntityRecord(
    'homepage',
    '',
    {
      featured_pack: packTemplates[packTemplates.length - 1].id,
    },
    token
  )

  /**
   * Create collections.
   */
  const collectionFactories = await Promise.all(
    Factory.buildList('collection', numCollections).map(async (item) => {
      const color = randColor()

      const collectionImage = await makeImage({
        token,
        text: item.translations[0].name,
        color: '#000000',
        backgroundColor: color,
      })

      const rewardImage = await makeImage({
        width: 700,
        height: 300,
        token,
        text: `Reward for ${item.translations[0].name}`,
        font: 'bold 24px Arial',
        color: '#ffffff',
        backgroundColor: color,
        lineWidth: 8,
      })

      item.collection_image = collectionImage.id
      item.reward_image = rewardImage.id

      return item
    })
  )
  const collections = await createEntityRecords(
    'collections',
    collectionFactories,
    token
  )

  /**
   * Create sets.
   */
  // Determine the number of of collectibles per collection based on input params.
  // For example, if we have 48 collectibles and we want 3 collections, numCollectiblesPerCollection = 16.
  const numCollectiblesPerCollection = numCollectibles / numCollections
  // Chunk the collectibles evenly into collections.
  const chunkedCollectionsOfCollectibles = chunkArray(
    collectibles,
    numCollectiblesPerCollection
  )
  await Promise.all(
    collections.map(async (collection, i) => {
      // For each collection, break the number of collectibles per collection evenly into sets of collectibles.
      const chunkedSetsOfCollectibles = chunkArray(
        chunkedCollectionsOfCollectibles[i],
        numCollectiblesPerSet
      )
      // Finally, build the set factories and create the records.
      const setFactories = chunkedSetsOfCollectibles.map((chunk) =>
        Factory.build('set', {
          collection: collection.id,
          nft_templates: chunk.map((item) => item.id),
        })
      )
      return await createEntityRecords('sets', setFactories, token)
    })
  )
}

console.log('Done!')

main(process.argv)
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => {
    return knex.destroy()
  })
