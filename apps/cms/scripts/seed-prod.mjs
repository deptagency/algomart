#!/usr/bin/env node

import 'dotenv/config'
import { configureKnex } from './knex.mjs'

import { setupSDK, setAccessToken } from './directus.mjs'
import { seedApplication } from './seed-application.mjs'
import { seedCountries } from './seed-countries.mjs'
import { seedFAQs } from './seed-faqs.mjs'
import { seedLanguages } from './seed-languages.mjs'
import { seedStaticPages } from './seed-static-pages.mjs'
import { setupWebhooks } from './webhooks.mjs'

const knex = configureKnex()

async function main() {
  const directus = await setupSDK(
    {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
    process.env.PUBLIC_URL
  )

  // Set the Access Token for the Admin user
  await setAccessToken(directus, process.env.ADMIN_ACCESS_TOKEN)

  /**
   * Begin seeding data.
   */
  console.log('Seeding CMS...')

  await seedLanguages(directus)
  await seedCountries(directus)
  await seedApplication(directus)
  await seedStaticPages(directus)
  await seedFAQs(directus)
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
