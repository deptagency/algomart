#!/usr/bin/env node

import 'dotenv/config'

import {
  chunkArray,
} from './utils.mjs'

const countriesList = {
  CA: [
    { languageCode: 'en-US', title: 'Canada' },
    { languageCode: 'fr-FR', title: 'Canada' },
    { languageCode: 'es-ES', title: 'Canadá' },
    { languageCode: 'ar', title: 'كندا' },
  ],
  US: [
    { languageCode: 'en-US', title: 'United States of America' },
    { languageCode: 'fr-FR', title: 'États-Unis' },
    { languageCode: 'es-ES', title: 'Estados Unidos' },
    { languageCode: 'ar', title: 'الولايات المتحدة' },
  ],
}

export async function seedCountries(directus) {
  console.log('- Countries')

  try {
    const countryRecords = []
    const countryCodesChunks = chunkArray(
      Object.keys(countriesList).map((code) => ({ code: code })),
      100
    )

    await Promise.all(
      countryCodesChunks.map(async (group) => {
        const countryGroup = await directus.items('countries').createMany(group)

        countryRecords.push(...countryGroup.data)
      })
    )

    const translationRecords = countryRecords
      .map(({ code }) => {
        return countriesList[code].map(({ languageCode, title }) => ({
          countries_code: code,
          languages_code: languageCode,
          title: title
        })
      )})
      .flat()

    const translationRecordsChunks = chunkArray(translationRecords, 100)

    await Promise.all(
      translationRecordsChunks.map(async (group) => {
        await directus.items('countries_translations').createMany(group)
      })
    )

  } catch (err) {
    console.log('Seed Countries Error.' + err)
  }
}
