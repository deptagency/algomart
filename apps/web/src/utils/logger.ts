import pino, { Logger } from 'pino'
import http from 'pino-http'

import { Environment } from '@/environment'

// https://getpino.io/#/docs/help?id=mapping-pino-log-levels-to-google-cloud-logging-stackdriver-serverity-levels
// https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
const PinoLevelToSeverityLookup = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
}

export const logger = pino({
  level: Environment.logLevel,
  ...(!Environment.isProduction && {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        colorize: true,
        messageKey: 'message',
        ignore: 'severity',
      },
    },
  }),
  messageKey: 'message',
  formatters: {
    level(label, number) {
      return {
        severity:
          PinoLevelToSeverityLookup[label] || PinoLevelToSeverityLookup['info'],
        level: number,
      }
    },
    log(message) {
      return { message }
    },
  },
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
  logger: logger as Logger,
  redact: {
    paths: ['req.headers', 'res.headers'],
    remove: true,
  },
})
