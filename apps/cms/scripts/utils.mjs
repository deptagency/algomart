#!/usr/bin/env node

import 'dotenv/config'

import axios from 'axios'
import { exec } from 'child_process'
import parse from 'csv-parse'
import FormData from 'form-data'
import { appendFile, createReadStream, createWriteStream, readdirSync, readFile, statSync, unlink } from 'fs'
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
    console.log(error.response?.data?.errors)
    process.exit(1)
  }
}

// Update entity in CMS DB.
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

// Import data into CMS. Does not override existing data.
export async function importDataFile(formData, collection, token) {
  try {
    const response = await axios.post(
      `${process.env.PUBLIC_URL}/utils/import/${collection}?access_token=${token}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...formData.getHeaders(),
        },
      }
    )
    return response.data.data
  } catch (error) {
    console.log(error.response?.data?.errors)
    process.exit(1)
  }
}

// Get fields for a collection.
export async function exportFieldsForCollection(collection, token) {
  try {
    const response = await axios.get(
      `${process.env.PUBLIC_URL}/fields/${collection}?access_token=${token}&export=json`,
    )
    const data = response.data
    const fields = data.map((item) => ({ name: item.field, required: item.required }))
    return fields
  } catch (error) {
    console.log(error.response.data.errors)
    process.exit(1)
  }
}

// Get all collections
export async function getCollections(token) {
  try {
    const response = await axios.get(
      `${process.env.PUBLIC_URL}/collections?access_token=${token}&export=json`,
    )
    const data = response.data
    const filteredData = data.filter((item) => !item.collection.includes('directus_'))
    const collections = filteredData.map((item) => item.collection)
    return collections
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

// Prompt individual CLI user input.
export function readlineMultipleAsync(prompt, nextPrompt) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    const answers = []
    const askQuestion = () => rl.question(prompt, async (answer) => {
      answers.push(answer)
      if ((await readlineAsync(`${nextPrompt} y/N: `)) !== 'y') {
        rl.close()
        resolve(answers)
      } else {
        askQuestion()
      }
    })
    askQuestion()
  })
}

// Parse CSV data and return JSON data.
export async function parseCsvData(file) {
  try {
    const data = []
    const parser = createReadStream(file)
      .pipe(parse({
        columns: true,
        skip_empty_lines: false,
      }));
    for await (const record of parser) {
      data.push(record)
    }
    return data
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

// Loop through directory and group files by extension.
export function groupFilesFromDirectoryByExtension(directory, extension) {
  return new Promise((resolve) => {
    const data = []
    const files = readdirSync(directory).map(f => f)
    for (const file of files) {
      const filePath = `${directory}/${file}`
      if (statSync(filePath).isFile()) {
        const fileExtension = filePath.split('.').pop()
        if (fileExtension === extension) {
          data.push(file)
        }
      }
    }
    resolve(data)
  })
}

// Check CSV file before CMS import.
export async function checkCsvAsync(data, collection, token) {
  try {
    // Retrieve field schema for collection
    const fields = await exportFieldsForCollection(collection, token)
    // Check keys for first record against field schema
    const firstRecordKeys = Object.keys(data[0])
    const doArraysMatch = fields.every((field) => {
      return firstRecordKeys.includes(field.name)
    })
    if (!doArraysMatch) {
      console.log(`File for ${collection} does not match schema`)
      process.exit(1)
    }
    // Check required fields
    const requiredFields = fields.filter((field) => field.required)
    for (const item of data) {
      for (const field of requiredFields) {
        if (!item[field.name]) {
          console.log(`Missing required field ${field.name}`)
          process.exit(1)
        }
      }
    }
    return true
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

// Update CSV image fields.
export async function updateCsvAsync(data, basePath, token) {
  try {
    const updatedData = []
    // @TODO: Get multi prompt working
    const imageFields = await readlineMultipleAsync(
      '> Provide image fields for document (i.e., preview_image): ',
      '> Would you like to provide other fields?'
    )
    // Loop through all rows of data
    for (const item of data) {
      const newItem = item
      for (const [key, value] of Object.entries(item)) {
        if (imageFields.includes(key)) {
          // Check if provided value is a UUID. If NOT, continue.
          const isUuid = value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
          if (!isUuid) {
            // Create image in database
            const imagePath = createReadStream(`${basePath}/images/${value}`)
            const formData = new FormData()
            formData.append('file', imagePath)
            const newImage = await createAssetRecords(formData, token)
            // Assign image ID to record
            newItem[key] = newImage.id
          }
        } else if (key === 'status' && !value) {
          newItem[key] = 'draft'
        } else if (!value) {
          newItem[key] = null
        }
      }
      updatedData.push(newItem)
    }
    return updatedData
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

// Remove provided file.
export function removeFile(file) {
  return new Promise((resolve) => {
    unlink(file, (error) => {
      if (error) {
        console.log(error)
        process.exit(1)
      }
      resolve()
    })
  })
}

export async function createXlsFile(basePath, collection, fields) {
  let data = ''
  for (let index = 0; index < fields.length; index++) {
    const char = index === fields.length ? '\n' : '\t'
    data += `${fields[index].name}${char}`
  }
  return new Promise((resolve, reject) => {
    appendFile(`${basePath}${collection}.xls`, data, (error) => {
      if (error) {
        reject(error)
      }
      resolve()
    })
  })
}
