import pino from 'pino'

import { Configuration } from '../configuration'

/**
 * Only use logger if you do not have access to a Fastify request.
 */
export const logger = pino({
  level: Configuration.logLevel,
  prettyPrint: Configuration.env !== 'production',
  // Use this with pino v7
  // ...(Configuration.env !== 'production' && {
  //   transport: { target: 'pino-pretty' },
  // }),
})
