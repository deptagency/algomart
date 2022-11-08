#!/usr/bin/env node

import 'dotenv/config'

import { chunkArray } from './utils.mjs'

const tags = [

  {
    slug: 'green',
    translations: [
      { languageCode: 'en-UK', title: 'green' },
      { languageCode: 'es-ES', title: 'verde' },
      { languageCode: 'fr-FR', title: 'vert' },
    ],
  },
  {
    slug: 'red',
    translations: [
      { languageCode: 'en-UK', title: 'red' },
      { languageCode: 'es-ES', title: 'rojo' },
      { languageCode: 'fr-FR', title: 'rouge' },
    ],
  },
  {
    slug: 'blue',
    translations: [
      { languageCode: 'en-UK', title: 'blue' },
      { languageCode: 'es-ES', title: 'azul' },
      { languageCode: 'fr-FR', title: 'bleu' },
    ],
  },
  {
    slug: 'yellow',
    translations: [
      { languageCode: 'en-UK', title: 'yellow' },
      { languageCode: 'es-ES', title: 'amarillo' },
      { languageCode: 'fr-FR', title: 'jaune' },
    ],
  },
  {
    slug: 'purple',
    translations: [
      { languageCode: 'en-UK', title: 'purple' },
      { languageCode: 'es-ES', title: 'morado' },
      { languageCode: 'fr-FR', title: 'violet' },
    ],
  },
  {
    slug: 'black',
    translations: [
      { languageCode: 'en-UK', title: 'black' },
      { languageCode: 'es-ES', title: 'negro' },
      { languageCode: 'fr-FR', title: 'noir' },
    ],
  },
  {
    slug: 'white',
    translations: [
      { languageCode: 'en-UK', title: 'white' },
      { languageCode: 'es-ES', title: 'blanco' },
      { languageCode: 'fr-FR', title: 'blanc' },
    ],
  },
]

export async function seedTags(directus) {
  console.log('- Tags')

  try {
    const tagRecords = []
    const tagSlugsChunks = chunkArray(
      tags.map(({ slug }, idx) => ({
        slug,
        sort: idx + 1
      })),
      100
    )
    await Promise.all(
      tagSlugsChunks.map(async (group) => {
        const tagGroup = await directus.items('tags').createMany(group)
        tagRecords.push(...tagGroup.data)
      })
    )

    const translationRecords = tagRecords
      .map(({ slug, id }) => {
        return tags
          .find((tag) => tag.slug === slug)
          .translations.map(({ languageCode, title }) => ({
            tags_id: id,
            languages_code: languageCode,
            title: title,
          }))
      })
      .flat()

    const translationRecordsChunks = chunkArray(translationRecords, 100)

    await Promise.all(
      translationRecordsChunks.map(async (group) => {
        await directus.items('tags_translations').createMany(group)
      })
    )
  } catch (err) {
    console.log('Seed Tags Error.' + err)
  }
}
