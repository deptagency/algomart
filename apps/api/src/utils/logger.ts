import pino from 'pino'

import { Configuration } from '../configuration'

export const prettyOptions = { translateTime: 'HH:MM:ss Z' }
/**
 * Only use logger if you do not have access to a Fastify request.
 */
export const logger = pino({
  level: Configuration.logLevel,
  ...(Configuration.env !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: prettyOptions,
    },
  }),
})
