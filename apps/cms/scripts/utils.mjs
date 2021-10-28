#!/usr/bin/env node

import 'dotenv/config'

import axios from 'axios'
import { exec } from 'child_process'
import { readFile } from 'fs'
import { createInterface } from 'readline'

// Group flat array into a multi-dimensional array of N items.
export function chunkArray(array, chunkSize) {
  return Array.from(new Array(Math.ceil(array.length / chunkSize)), (_, i) =>
    array.slice(i * chunkSize, i * chunkSize + chunkSize)
  )
}

// Post CMS assets to CMS DB.
export async function createAssetRecords(formData, token) {
  try {
    const res = await axios.post(
      `${process.env.PUBLIC_URL}/files?access_token=${token}`,
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
    console.log(error.response.data.errors)
    process.exit(1)
  }
}

export async function updateEntityRecord(entity, id, body, token) {
  try {
    const res = await axios.patch(
      `${process.env.PUBLIC_URL}/items/${entity}/${id}?access_token=${token}`,
      body
    )
    return res.data.data
  } catch (error) {
    console.log(error.response.data.errors)
    process.exit(1)
  }
}

// Post CMS collection record(s) to CMS DB.
export async function createEntityRecords(entity, body, token) {
  try {
    const res = await axios.post(
      `${process.env.PUBLIC_URL}/items/${entity}?access_token=${token}`,
      body
    )
    return res.data.data
  } catch (error) {
    console.log(error.response.data.errors)
    process.exit(1)
  }
}

// Execute a CLI command and get the results of its output.
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

// Retrieve a temporary auth token from the CMS.
export async function getCMSAuthToken(body) {
  try {
    const tokenResponse = await axios.post(
      `${process.env.PUBLIC_URL}/auth/login`,
      body
    )
    return tokenResponse.data.data.access_token
  } catch (error) {
    console.error(`Authentication Failed: ${error}`)
    process.exit(1)
  }
}

// Get CLI input from the user.
export async function getConfigFromStdin() {
  console.log('Enter the CMS configuration.')
  const email = await readlineAsync('> Email address: ')
  const password = await readlineAsync('> Password: ')
  return {
    email,
    password,
  }
}

// Read CMS configuration file.
export function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    readFile(file, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

// Prompt individual CLI user input.
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
