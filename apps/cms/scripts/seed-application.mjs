#!/usr/bin/env node

import 'dotenv/config'

export async function seedApplication(directus) {
  console.log('- Application')
  
  try {
    const application = await directus.singleton('application').update()
    const default_country = await directus.items('countries').readByQuery({
      filter: {
        code: {
          _eq: 'US'
        },
      },
    })

    await directus.items('application_countries').createOne({
      application_id: application.id,
      countries_id: default_country?.data[0]?.id,
    })
  } catch (err) {
    console.log('Seed Application Error: ' + err)
  }
}
