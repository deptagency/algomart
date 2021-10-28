import { HttpError } from 'http-errors'
import { HTTPError } from 'ky'
import { NextApiRequest, NextApiResponse } from 'next'

import { logger } from '@/utils/logger'

export default async function errorHandler(
  error: Error | HttpError,
  _: NextApiRequest,
  response: NextApiResponse
) {
  logger.error(error)

  if (error instanceof HTTPError) {
    // errors from ky
    response.status(error.response.status).json(await error.response.json())
  } else if (error instanceof HttpError) {
    // errors from http-errors
    response.status(error.status).json({
      statusCode: error.status,
      error: error.name,
      message: error.message,
    })
  } else {
    // everything else
    response.status(500).json({
      statusCode: 500,
      error: error.name,
      message: error.message,
    })
  }
}
