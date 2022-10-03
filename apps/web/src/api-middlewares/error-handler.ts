import axios from 'axios'
import { HttpError } from 'http-errors'
import { HTTPError as KyHTTPError } from 'ky'
import { NextApiRequest, NextApiResponse } from 'next'

import { AppConfig } from '@/config'
import { createLogger } from '@/utils/logger'

const logger = createLogger(AppConfig.logLevel)

interface ErrorBody {
  statusCode: number
  error: string
  errors?: unknown
  message?: string
}

export async function errorHandler(
  error: Error | HttpError,
  _: NextApiRequest,
  response: NextApiResponse
) {
  const allowedProps: (keyof ErrorBody)[] = ['statusCode', 'error', 'errors']
  if (!AppConfig.isProduction) {
    allowedProps.push('message')
  }

  let statusCode = 500
  let contentTypeHeader = 'application/json'
  let errorBody: ErrorBody = {
    statusCode,
    error: error.name,
    message: error.message,
  }

  if (axios.isAxiosError(error)) {
    statusCode = error.response?.status ?? statusCode
    errorBody = (error.response?.data ?? errorBody) as ErrorBody
    contentTypeHeader =
      error.response?.headers['content-type'] ?? contentTypeHeader
  } else if (error instanceof KyHTTPError) {
    // errors from ky
    statusCode = error.response.status
    errorBody = await error.response.json()
  } else if (error instanceof HttpError) {
    // errors from http-errors
    statusCode = error.status
    errorBody = {
      statusCode: error.status,
      error: error.name,
      message: error.message,
    }
  }

  // Filter out any disallowed fields to avoid leaking sensitive information
  errorBody = Object.fromEntries(
    allowedProps.map((property) => [property, errorBody[property]])
  ) as unknown as ErrorBody

  if (statusCode >= 500) {
    logger.error(error)
  } else {
    // Non-500 errors should be safe to ignore in production
    logger.debug(error)
  }

  response
    .setHeader('content-type', contentTypeHeader)
    .status(statusCode)
    .send(errorBody)
}
