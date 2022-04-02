import { createLogger } from '@algomart/shared/utils'

import { Configuration } from './'

/**
 * Only use this logger if you do not have access to a Fastify request.
 */
export const logger = createLogger(Configuration.logLevel)
