/* eslint-disable unicorn/no-process-exit */

// Based on https://github.com/dnlup/fastify-traps
// Adds support for promises and Fastify v4

import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

export interface FastifyTrapsOptions {
  onClose: () => Promise<void> | void
  onError: (error: Error) => Promise<void> | void
  onTimeout: (timeout: number) => Promise<void> | void
  onSignal: (signal: NodeJS.Signals) => Promise<void> | void
  timeout: number
}

// 30 seconds
const defaultOptions: FastifyTrapsOptions = {
  onClose: () => Promise.resolve(),
  onError: () => Promise.resolve(),
  onTimeout: () => Promise.resolve(),
  onSignal: () => Promise.resolve(),
  timeout: 30_000,
}

function handleCloseSignal(
  fastify: FastifyInstance,
  options: FastifyTrapsOptions
) {
  return async (signal: NodeJS.Signals) => {
    await options.onSignal(signal)

    const timer = setTimeout(async () => {
      await options.onTimeout(options.timeout)
      process.exit(1)
    }, options.timeout)

    try {
      await fastify.close()
      await options.onClose()
      clearTimeout(timer)
      process.exit()
    } catch (error) {
      await options.onError(error)
      clearTimeout(timer)
      process.exit(1)
    }
  }
}

export const fastifyTrapsPlugin = fp<Partial<FastifyTrapsOptions>>(
  function fastifyTraps(
    fastify: FastifyInstance,
    options: Partial<FastifyTrapsOptions>,
    done: (error?: Error) => void
  ) {
    const fullOptions = Object.assign({}, defaultOptions, options)
    const handler = handleCloseSignal(fastify, fullOptions)
    const signals = ['SIGINT', 'SIGTERM']

    for (const signal of signals) {
      if (process.listenerCount(signal) > 0) {
        return done(new Error(`${signal} handler already configured`))
      }

      process.once(signal, handler)
    }

    done()
  },
  {
    name: 'fastify-traps',
  }
)
