#!/usr/bin/env node

const languageList = [
  { code: 'en-US', name: 'English', sort: 1 },
  { code: 'fr-FR', name: 'Français', sort: 2 },
  { code: 'es-ES', name: 'Español', sort: 3 },
  { code: 'ar', name: 'العربية', sort: 4 },
]

export async function seedLanguages(directus) {
  console.log('- Languages')

  await directus.items('languages').createMany(languageList)
}
