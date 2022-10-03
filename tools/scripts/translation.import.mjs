#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import csvParser from 'csv-parser'

const langs = [
  'en-US',
  'en-UK',
  'es-ES',
  'fr-FR',
]

async function main() {
  await importContent('apps/web/languages/csv/import', 'apps/web/languages')
  await importContent('apps/scribe/src/languages/csv/import', 'apps/scribe/src/languages')
}

async function importContent(inputPath, outputPath) {
  const dirents = fs.readdirSync(inputPath, { withFileTypes: true });
  const filenames = dirents
    .filter(dirent => dirent.isFile())
    .filter(dirent => path.extname(dirent.name).toLowerCase() === ".csv")
    .map(dirent => dirent.name);

  for (let filename of filenames) {
    let languageContent = {}

    for (let lang of langs) {
      languageContent[lang] = {}
    }

    const readStream = fs.createReadStream(path.join(inputPath, filename)).pipe(csvParser())

    for await (const row of readStream) {
      for (let lang of langs) {
        setValue(languageContent[lang], row['key'], row[lang])
      }
    }

    for (let lang of langs) {
      let content = languageContent[lang]
      let json = JSON.stringify(content, null, 2)
      let langPath = path.join(outputPath, lang)
      let langFilename = path.parse(filename).name + '.json'

      if (!fs.existsSync(langPath)) {
        fs.mkdirSync(langPath, { recursive: true });
      }

      fs.writeFile(path.join(langPath, langFilename), json, (err) => {
        if (err) {
          throw err;
        }
      })
    }
  }
}

function setValue(content, key, value) {
  if (key.includes(".")) {
    let nodes = key.split('.')
    let nodeKey = nodes[0]

    nodes.shift()

    let nextKey = nodes.join('.')

    if (!content.hasOwnProperty(nodeKey)) {
      content[nodeKey] = {}
    }

    setValue(content[nodeKey], nextKey, value)
  } else {
    if (value === "") {
      content[key] = null
    } else {
      content[key] = value
    }
  }
}

main(process.argv)
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
