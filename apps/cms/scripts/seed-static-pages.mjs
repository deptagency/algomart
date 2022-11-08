#!/usr/bin/env node

import 'dotenv/config'
import { Factory } from './seed-data/factories.mjs'

const slugMap = [
  'about-nfts',
  'data-protection-portal',
  'downloads',
  'privacy-policy',
  'support',
  'terms-of-service',
  'aml-policy',
]

export async function seedStaticPages(directus) {
  console.log('- Static Pages')
  try {
    const pageFactories = slugMap.map((slug) => {
      return Factory.build('page', {
        slug,
        translations: [
          {
            languages_code: 'en-UK',
            hero_banner_title: slug,
            hero_banner_subtitle: '',
            title: '',
            content: '',
          },
        ]

      })
    })
    await directus.items('static_page').createMany(pageFactories)
  } catch (err) {
    console.log('Seed Static Pages Error: ' + err)
  }
}
