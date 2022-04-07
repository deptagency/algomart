#!/usr/bin/env node

import axios from 'axios'
import 'dotenv/config'
import path from 'node:path'
import { exec } from 'node:child_process'
import { readFile } from 'node:fs'
import { createInterface } from 'node:readline'
import * as stream from 'node:stream'
import PureImage from 'pureimage'
import FormData from 'form-data'

/** Group flat array into a multi-dimensional array of N items. */
export function chunkArray(array, chunkSize) {
  return Array.from(new Array(Math.ceil(array.length / chunkSize)), (_, i) =>
    array.slice(i * chunkSize, i * chunkSize + chunkSize)
  )
}

/**
 * Post CMS assets to CMS DB
 * @param {FormData} formData
 * @param {import('@directus/sdk').Directus} directus
 */
export async function createAssetRecords(formData, directus) {
  try {
    // Manually using Axios...
    const res = await axios.post(
      `${process.env.PUBLIC_URL}/files?access_token=${directus.auth.token}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...formData.getHeaders(),
        },
      }
    )
    return res.data.data
  } catch (error) {
    console.log(error.response?.data?.errors)
    process.exit(1)
  }
}

/**
 * Update entity in CMS DB.
 * @param {import('@directus/sdk').Directus} directus
 * @param {string} entity
 * @param {any} id
 * @param {object} body
 */
export async function updateEntityRecord(directus, entity, id, body) {
  try {
    return await directus.items(entity).updateOne(id, body)
  } catch (error) {
    console.log(error.response.data.errors)
    process.exit(1)
  }
}

/**
 * Post CMS collection record(s) to CMS DB.
 * @param {import('@directus/sdk').Directus} directus
 * @param {string} entity
 * @param {object[]} items
 */
export async function createEntityRecords(directus, entity, items) {
  try {
    const result = await directus.items(entity).createMany(items)
    return result.data
  } catch (error) {
    console.log(error.response.data.errors)
    process.exit(1)
  }
}

/** Execute a CLI command and get the results of its output. */
export function execCommandAndGetOutput(command) {
  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        cwd: process.cwd(),
        shell: true,
      },
      (error, stdout) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout)
        }
      }
    )
  })
}

/** Prompt individual CLI user input. */
export function readlineAsync(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

export function registerFonts() {
  PureImage.registerFont(
    path.resolve('scripts/seed-data/Inter.ttf'),
    'Inter'
  ).loadSync()
}

export function streamToBuffer() {
  let chunks = []
  let buffer = null

  const writableStream = new stream.Writable({
    write(chunk, _encoding, next) {
      chunks.push(chunk)
      next()
    },
  })

  writableStream.on('finish', () => {
    buffer = Buffer.concat(chunks)
  })

  const getBuffer = () => {
    return new Promise((resolve) => {
      const tick = () => {
        setImmediate(() => {
          if (buffer) resolve(buffer)
          else tick()
        })
      }

      tick()
    })
  }

  return { writableStream, getBuffer }
}

export async function makeImage({
  width = 1024,
  height = 1024,
  text = 'Placeholder',
  filename = 'image.png',
  color = '#ffffff',
  backgroundColor = '#000000',
  font = '64px Inter',
  lineWidth = 16,
  borderColor,
  directus,
} = {}) {
  const canvas = PureImage.make(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)
  ctx.strokeStyle = borderColor || color
  ctx.lineWidth = lineWidth
  ctx.strokeRect(24, 24, width - 48, height - 48)
  const { getBuffer, writableStream } = streamToBuffer()

  PureImage.encodePNGToStream(canvas, writableStream)

  const formData = new FormData()
  formData.append('title', text)
  formData.append('file', await getBuffer(), { filename })

  return await createAssetRecords(formData, directus)
}
