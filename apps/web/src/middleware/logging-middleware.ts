import { NextApiRequest, NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'
import http from 'pino-http'

export default function loggingMiddleware(
  logger: ReturnType<typeof http>
): RequestHandler<NextApiRequest, NextApiResponse> {
  return async (request, response, next) => {
    logger(request, response, next)
  }
}
