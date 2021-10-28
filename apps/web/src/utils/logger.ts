import pino from 'pino'
import http from 'pino-http'

import { Environment } from '@/environment'

export const logger = pino({
  level: Environment.logLevel,
  ...(!Environment.isProduction && {
    transport: { target: 'pino-pretty' },
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

export const loggerHttp = http({
  logger,
  redact: {
    paths: ['req.headers', 'res.headers'],
    remove: true,
  },
})
