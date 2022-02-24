#!/usr/bin/env node

import 'dotenv/config'

import { createInterface } from 'readline'

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
