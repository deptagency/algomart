#!/usr/bin/env node

import 'dotenv/config'

import { seedLanguages } from './seed-languages.mjs'
import { seedCountries } from './seed-countries.mjs'
import { setupWebhooks } from './webhooks.mjs'

async function main() {
  const directus = await setupSDK({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })

  // Set the Access Token for the Admin user
  await setAccessToken(directus)

  // Set the Access Token for the Admin user
  await setAccessToken(directus)

  /**
   * Begin seeding data.
   */
  console.log('Seeding CMS...')

  const directus = await setupSDK({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })

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
