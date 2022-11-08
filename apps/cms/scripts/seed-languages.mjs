#!/usr/bin/env node
const languageList = [
  { code: 'en-UK', label: 'English', sort: 1 },
  { code: 'fr-FR', label: 'Français', sort: 2 },
  { code: 'es-ES', label: 'Español', sort: 3 },
]

export async function seedLanguages(directus) {
  console.log('- Languages')

  await directus.items('languages').createMany(languageList)
}
