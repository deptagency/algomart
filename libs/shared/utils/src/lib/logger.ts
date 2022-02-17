import pino from 'pino'

/**
 * Only use logger if you do not have access to a Fastify request.
 */
export const createLogger = (logLevel: string, env: string) => {
  return pino({
    level: logLevel,
    ...(env !== 'production' && {
      transport: { target: 'pino-pretty' },
    }),
  })
}
