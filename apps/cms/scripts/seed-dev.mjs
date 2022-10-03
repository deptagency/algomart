#!/usr/bin/env node

import 'dotenv/config'

import { setupSDK, setAccessToken, setFilePermission } from './directus.mjs'
import { configureKnex } from './knex.mjs'
import { randColor } from './seed-data/color.mjs'
import { Factory, raritiesMeta } from './seed-data/factories.mjs'
import { setupWebhooks } from './webhooks.mjs'
import {
  chunkArray,
  makeImage,
  readlineAsync,
  registerFonts,
} from './utils.mjs'
import { seedApplication } from './seed-application.mjs'
import { seedCountries } from './seed-countries.mjs'
import { seedFAQs } from './seed-faqs.mjs'
import { seedLanguages } from './seed-languages.mjs'
import { seedStaticPages } from './seed-static-pages.mjs'
import { seedTags } from './seed-tags.mjs'
import { makeVideo } from './utils.mjs'

const knex = configureKnex()

async function main() {
  registerFonts()

  console.log('Configure Directus SDK...')
  const directus = await setupSDK(
    {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
    process.env.PUBLIC_URL
  )

  // Set the Access Token for the Admin user
  await setAccessToken(directus, process.env.ADMIN_ACCESS_TOKEN)

  // set file access permissions
  await setFilePermission(directus)

  /**
   * To prevent errors when seeding, it's best to start from a fresh DB.
   * Ask user to confirm the destructive operation, and if so, truncate the tables before seeding.
   */
  console.log(
    'Directus seeder running. This operation will overwrite any records in your database, are you sure you want to proceed?'
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
    frequently_asked_questions,
    frequently_asked_questions_translations,
    homepage,
    languages,
    nft_templates_translations,
    nft_templates,
    tags,
    tags_translations,
    nft_templates_tags,
    pack_templates_tags,
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
  await seedStaticPages(directus)
  await seedTags(directus)

  await setupWebhooks(
    directus,
    'CMS Cache Content',
    process.env.SCRIBE_WEBHOOK_URL,
    [
      'application',
      'collections',
      'countries',
      'frequently_asked_questions',
      'homepage',
      'languages',
      'nft_templates',
      'pack_templates',
      'rarities',
      'sets',
      'static_page',
      'tags',
    ]
  )

  /**
   * These numbers can be adjusted, just be mindful of the implications.
   * Disproportional values can break the cascade of how assets are divy'd up.
   * This can lead to empty packs/collections/sets, or might just error.
   * These numbers were chosen to create a reasonably balanced set of data.
   */
  const multiplier = 1 // Crank this up to create more of everything

  const numCollectibles = 48 * multiplier
  const numCollectiblesPerPack = 6
  const numCollections = 3
  const numCollectiblesPerSet = 4
  const numRarities = raritiesMeta.length
  const e2eCollectibleCount = 100
  const e2eRarity = 1 // E2E tests will use this rarity. 0 = Bronze, 1 = Silver, 2 = Gold

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
  await seedApplication(directus)

  /**
   * Create homepage
   */
  console.log('- Homepage')

  const heroBannerColor = randColor()
  const heroBanner = await makeImage({
    directus,
    text: '',
    height: 512,
    width: 1024,
    backgroundColor: heroBannerColor,
  })
  const homepageFactory = Factory.build('homepage')
  homepageFactory.hero_banner = heroBanner
  const homepage = await directus.singleton('homepage').update(homepageFactory)

  /**
   * Create faqs
   */
  await seedFAQs(directus, homepage)

  /**
   * Create rarities.
   */
  console.log('- Rarities Files')
  const rarityFactories = await Promise.all(
    Factory.buildList('rarity', numRarities).map(async (rarity) => {
      const previewImage = await makeImage({
        directus,
        text: rarity.translations[0].name,
        color: '#000000',
        backgroundColor: rarity.color,
      })

      rarity.image = previewImage
      rarity.homepage = homepage.id

      return rarity
    })
  )

  console.log('- Rarities')
  const rarities = (
    await directus.items('rarities').createMany(rarityFactories)
  ).data

  let tagList = (await directus.items('tags').readByQuery({})).data

  /**
   * Creates N collectibles with mixed rarities.
   */
  console.log('- NFT Files')
  const previewVideo = await makeVideo({ directus })

  let notableCount = 0
  const buildList = Factory.buildList('collectible', numCollectibles)
  const collectibleFactories = []
  let i = 0
  console.group()
  for (let item of buildList) {
    const isNotable = notableCount < 8
    if (isNotable) {
      notableCount++
    }
    const randomNumber = Math.random()
    // 1/10 chance of Gold
    // 3/10 chance of Silver
    // 6/10 chance of Bronze
    const rarityIndex = randomNumber < 0.1 ? 0 : randomNumber < 0.4 ? 1 : 2
    const rarity = rarities[rarityIndex]
    item.rarity = rarity.id

    console.log(
      `- Collectible ${i + 1} of ${numCollectibles}. ${
        raritiesMeta[rarityIndex].name
      }`
    )

    const previewImage = await makeImage({
      directus,
      text: item.translations[0].title,
      color: '#000000',
      borderColor: rarity?.color || '#000000',
      backgroundColor: randColor(),
    })

    item.preview_image = previewImage.id
    item.preview_video = rarityIndex < 2 ? previewVideo : null // put preview videos on Gold and Silver (this is arbitrary)
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
      const collectibleGroup = (
        await directus.items('nft_templates').createMany(group)
      ).data
      collectibles.push(...collectibleGroup)
    })
  )

  // Tag the Collectibles
  const collectibleTags = []

  collectibles.map((collectible) => {
    tagList = tagList.sort(() => 0.5 - Math.random())
    const tagCount = Math.floor(Math.random() * 5) + 1
    const tags = tagList.slice(0, tagCount)

    tags.map((tag) =>
      collectibleTags.push({
        nft_templates_id: collectible.id,
        tags_id: tag.id,
      })
    )
  })

  const collectibleTagsChunks = chunkArray(collectibleTags, 100)

  await Promise.all(
    collectibleTagsChunks.map(
      async (group) =>
        await directus.items('nft_templates_tags').createMany(group)
    )
  )

  /**
   * Create N packs, each with numCollectiblesPerPack (where N = numCollectibles / numCollectiblesPerPack).
   * This distributes all of the collectibles evenly across packs.
   * Example: if we have 48 collectibles and we want 6 collectibles per pack, we'll have 8 packs.
   */
  console.log('- Pack Files')
  const chunkedCollectibles = chunkArray(collectibles, numCollectiblesPerPack)
  let upcomingCount = 0
  const packFactories = await Promise.all(
    chunkedCollectibles.map(async (chunk) => {
      const color = randColor()
      const isUpcoming = upcomingCount < 5
      if (isUpcoming) {
        upcomingCount++
      }

      const pack = Factory.build('pack', {
        nfts_per_pack: numCollectiblesPerPack,
        nft_templates: chunk.map((collectible) => collectible.id),
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
  const packTemplates = (
    await directus.items('pack_templates').createMany(packFactories)
  ).data

  // Tag the Collectibles
  const packTags = []

  packTemplates.map((packTemplate) => {
    tagList = tagList.sort(() => 0.5 - Math.random())
    const tagCount = Math.floor(Math.random() * 5) + 1
    const tags = tagList.slice(0, tagCount)

    tags.map((tag) =>
      packTags.push({ pack_templates_id: packTemplate.id, tags_id: tag.id })
    )
  })

  const packTagsChunks = chunkArray(packTags, 100)

  await Promise.all(
    packTagsChunks.map(
      async (group) =>
        await directus.items('pack_templates_tags').createMany(group)
    )
  )

  await directus.singleton('homepage').update({
    hero_pack: packTemplates[packTemplates.length - 1].id,
  })

  /**
   * Create collections.
   */
  console.log('- Collections Files')
  const collectionFactories = await Promise.all(
    Factory.buildList('collection', numCollections).map(async (item, index) => {
      const color = randColor()

      const collectionImage = await makeImage({
        directus,
        text: (index + 1).toString(),
        color: '#ffffff',
        backgroundColor: color,
        font: '600px Inter',
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
  const collections = (
    await directus.items('collections').createMany(collectionFactories)
  ).data

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

  // Create NFT for use in e2e tests
  console.log('- E2E Collectible')
  const e2eCollectibleData = Factory.build('collectible')
  e2eCollectibleData.total_editions = e2eCollectibleCount
  e2eCollectibleData.unique_code = 'e2easset'
  e2eCollectibleData.rarity = rarities[e2eRarity].id
  e2eCollectibleData.translations[0].title = 'E2E NFT Title'
  e2eCollectibleData.translations[0].subtitle = 'E2E NFT Subtitle'
  e2eCollectibleData.translations[0].body = 'E2E NFT Description'

  const e2ePreviewVideo = await makeVideo({ directus })
  const e2ePreviewImage = await makeImage({
    directus,
    text: e2eCollectibleData.translations[0].title,
    color: '#000000',
    borderColor: rarities[e2eRarity].color,
    backgroundColor: '#ff0000',
  })

  e2eCollectibleData.preview_image = e2ePreviewImage.id
  e2eCollectibleData.preview_video = e2ePreviewVideo
  e2eCollectibleData.homepage = homepage.id
  const e2eCollectible = await directus
    .items('nft_templates')
    .createOne(e2eCollectibleData)

  // Create Pack for use in e2e tests
  console.log('- E2E Pack')
  const e2ePackData = Factory.build('pack', {
    nfts_per_pack: 1,
    nft_templates: [e2eCollectible.id],
    homepage: homepage.id,
  })
  e2ePackData.slug = 'e2e-pack'
  e2ePackData.price = 10000
  e2ePackData.translations[0].title = 'E2E Pack Title'
  e2ePackData.translations[0].subtitle = 'E2E Pack Subtitle'
  e2ePackData.translations[0].body = 'E2E Pack Description'

  const e2ePackDataImage = await makeImage({
    directus,
    text: e2ePackData.translations[0].title,
    color: '#000000',
    backgroundColor: '#0000ff',
  })

  e2ePackData.pack_image = e2ePackDataImage.id

  await directus.items('pack_templates').createOne(e2ePackData)

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
