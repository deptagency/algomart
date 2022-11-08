import { NextApiRequest, NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'
import http from 'pino-http'

export function loggingMiddleware(
  logger: ReturnType<typeof http>
): RequestHandler<NextApiRequest, NextApiResponse> {
  return async (request, response, next) => {
    logger(request, response, next)
  }
}
