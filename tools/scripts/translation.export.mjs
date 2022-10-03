#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import csvWriter from 'csv-write-stream'

const sourceLang = 'en-US'
const langs = [
  'en-US',
  'en-UK',
  'es-ES',
  'fr-FR',
]

async function main() {
  await exportContent('apps/web/languages', 'apps/web/languages/csv/export')
  await exportContent('apps/scribe/src/languages', 'apps/scribe/src/languages/csv/export')
}

async function exportContent(inputPath, outputPath) {
  const sourceDir = path.join(inputPath, sourceLang)
  for (let filename of fs.readdirSync(sourceDir)) {
    let keys = loadKeys(inputPath, filename)
    let languageContent = {}

    for (let lang of langs) {
      languageContent[lang] = loadFile(inputPath, lang, filename)
    }

    const outputFilename = path.parse(filename).name + '.csv'
    await generateCSV(path.join(outputPath, outputFilename), keys, langs, languageContent)
  }
}

function loadFile(dir, lang, filename) {
  const filePath = path.join(dir, lang, filename)

  return JSON.parse(fs.readFileSync(filePath))
}

function loadKeys(path, filename) {
  const content = loadFile(path, sourceLang, filename)
  let keys = []

  return Object.entries(content).flatMap(([key, value]) => {
    return [...keys, buildKeys(null, key, value)]
  }).flat()
}

function buildKeys(baseKey, key, value) {
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([childKey, childValue]) => {
      return buildKeys(buildKey(baseKey, key), childKey, childValue)
    })
  } else {
    return buildKey(baseKey, key)
  }
}

function buildKey(base, key) {
  if (base) {
    return [base, key].join('.')
  }

  return key
}

async function generateCSV(filename, keys, langs, languageContent) {
  const writeStream = csvWriter()
  await writeStream.pipe(fs.createWriteStream(filename))

  for (let key of keys) {
    let record = {}
    record["key"] = key

    for (let lang of langs) {
      record[lang] = getValue(key, lang, languageContent[lang])
    }

    writeStream.write(record)
  }

  await writeStream.end()
}

function getValue(key, lang, content) {
  if (content === undefined) return null

  if (key.includes(".")) {
    let nodes = key.split('.')
    let nodeKey = nodes[0]

    nodes.shift()

    return getValue(nodes.join('.'), lang, content[nodeKey])
  }

  return content[key] || null
}

main(process.argv)
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
