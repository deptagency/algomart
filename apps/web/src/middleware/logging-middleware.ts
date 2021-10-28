import { NextApiRequest, NextApiResponse } from 'next'
import { RequestHandler } from 'next-connect'
import { HttpLogger } from 'pino-http'

export default function loggingMiddleware(
  logger: HttpLogger
): RequestHandler<NextApiRequest, NextApiResponse> {
  return async (request, response, next) => {
    logger(request, response, next)
  }
}
