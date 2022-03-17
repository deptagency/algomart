import pino from 'pino'

import { Configuration } from '../configuration'

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

/**
 * Only use logger if you do not have access to a Fastify request.
 */
export const logger = pino({
  level: Configuration.logLevel,
  ...(Configuration.env !== 'production' && {
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
