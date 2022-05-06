#!/usr/bin/env node

import 'dotenv/config'

import { setupSDK, setAccessToken, setFilePermission } from './directus.mjs'
import { configureKnex } from './knex.mjs'
import { randColor } from './seed-data/color.mjs'
import { Factory } from './seed-data/factories.mjs'
import { setupWebhooks } from './webhooks.mjs'
import {
  chunkArray,
  makeImage,
  readlineAsync,
  registerFonts
} from './utils.mjs'
import { seedLanguages } from './seed-languages.mjs'
import { seedCountries } from "./seed-countries.mjs"

const knex = configureKnex()

async function main() {
  registerFonts()

  console.log('Configure Directus SDK...')
  const directus = await setupSDK({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })

  // Set the Access Token for the Admin user
  await setAccessToken(directus)

  // set file access permisiosns
  await setFilePermission(directus)

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
    application_countries,
    application,
    collections_translations,
    collections,
    countries_translations,
    countries,
    directus_files,
    homepage,
    languages,
    nft_templates_translations,
    nft_templates,
    pack_templates_directus_files,
    pack_templates_translations,
    pack_templates,
    rarities_translations,
    rarities,
    sets_translations,
    sets
    CASCADE`)

  /**
   * Begin seeding data.
   */
  console.log('Seeding database...')

  await seedLanguages(directus)
  await seedCountries(directus)
  await setupWebhooks(directus, 'CMS Cache Content', process.env.SCRIBE_WEBHOOK_URL, [
    'application',
    'collections',
    'countries',
    'homepage',
    'languages',
    'nft_templates',
    'pack_templates',
    'rarities',
    'sets',
  ])

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
   * Create application and application countries
   */
  console.log('- Application')
  const application = await directus.singleton('application').update({
    currency: 'USD'
  })
  await directus.items('application_countries').createOne({
    application_id: application.id,
    countries_code: 'US'
  })

  /**
   * Create homepage
   */
  console.log('- Homepage')
  const homepageFactory = Factory.build('homepage')
  const homepage = (await directus.singleton('homepage').update(homepageFactory))
  /**
   * Create rarities.
   */
  console.log('- Rarities')
  const rarityFactories = Factory.buildList('rarity', numRarities)
  const rarities = (await directus.items('rarities').createMany(rarityFactories)).data

  /**
   * Creates N collectibles with mixed rarities.
   */
  console.log('- NFT Files')
  let notableCount = 0
  const buildList = Factory.buildList('collectible', numCollectibles)
  const collectibleFactories = []
  let i = 0
  console.group()
  for (let item of buildList) {
    console.log(`- NFT File image ${i + 1} of ${numCollectibles}`)

    const isNotable = notableCount < 8
    if (isNotable) {
      notableCount++
    }
    // Using rarityLikelihood will apply rarities to some of the items.
    const rarity = rarities[i % rarityLikelihood]
    item.rarity = rarity?.id || null // no rarity if null

    const previewImage = await makeImage({
      directus,
      text: item.translations[0].title,
      color: '#000000',
      borderColor: rarity?.color || '#000000',
      backgroundColor: randColor(),
    })

    item.preview_image = previewImage.id
    item.homepage = isNotable ? homepage.id : null

    collectibleFactories.push(item)
    i++
  }
  console.groupEnd()

  // Directus only supports 100 items per batch, so split them up into groups of 100
  console.log('- NFT Templates')
  const collectibles = []
  const collectibleChunks = chunkArray(collectibleFactories, 100)
  await Promise.all(
    collectibleChunks.map(async (group) => {
      const collectibleGroup = (await directus.items('nft_templates').createMany(group)).data
      collectibles.push(...collectibleGroup)
    })
  )

  /**
   * Create N packs, each with numCollectiblesPerPack (where N = numCollectibles / numCollectiblesPerPack).
   * This distributes all of the collectibles evenly across packs.
   * Example: if we have 48 collectibles and we want 6 collectibles per pack, we'll have 8 packs.
   */
  console.log('- Pack Files')
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
        directus,
        text: pack.translations[0].title,
        color: '#000000',
        backgroundColor: color,
      })

      pack.pack_image = packImage.id

      return pack
    })
  )
  console.log('- Pack Templates')
  const packTemplates = (await directus.items('pack_templates').createMany(packFactories)).data
  await directus.singleton('homepage').update({
    featured_pack: packTemplates[packTemplates.length - 1].id,
  })

  /**
   * Create collections.
   */
  console.log('- Collections Files')
  const collectionFactories = await Promise.all(
    Factory.buildList('collection', numCollections).map(async (item) => {
      const color = randColor()

      const collectionImage = await makeImage({
        directus,
        text: item.translations[0].name,
        color: '#000000',
        backgroundColor: color,
      })

      const rewardImage = await makeImage({
        width: 700,
        height: 300,
        directus,
        text: `Reward for ${item.translations[0].name}`,
        font: '24px Inter',
        color: '#ffffff',
        backgroundColor: color,
        lineWidth: 8,
      })

      item.collection_image = collectionImage.id
      item.reward_image = rewardImage.id

      return item
    })
  )

  console.log('- Collections')
  const collections = (await directus.items('collections').createMany(collectionFactories)).data

  /**
   * Create sets.
   */
  console.log('- Sets')
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
      return (await directus.items('sets').createMany(setFactories)).data
    })
  )

  console.log('Done!')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => {
    return knex.destroy()
  })
