import { Configuration } from '../configuration'

import { createLogger } from '@algomart/shared/utils'

/**
 * Only use this logger if you do not have access to a Fastify request.
 */
export const logger = createLogger(Configuration.logLevel, Configuration.env)
