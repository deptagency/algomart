import pino from 'pino'

import { Configuration } from '../configuration'

export const prettyOptions = { translateTime: 'HH:MM:ss Z', colorize: true }
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
  serializers: {
    ...pino.stdSerializers,
    req: function asRequestValue(request) {
      return {
        method: request.method,
        url: request.url,
        version: request.headers['accept-version'],
        hostname: request.hostname,
        remoteAddress: request.ip,
        remotePort: request.socket.remotePort,
      }
    },
    res: function asReplyValue(reply) {
      return {
        statusCode: reply.statusCode,
      }
    },
  },
})
