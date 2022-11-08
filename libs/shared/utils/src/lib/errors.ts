import { FastifyError } from '@fastify/error'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { HttpError } from 'http-errors'

export class UserError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    Object.setPrototypeOf(this, UserError.prototype)
  }
}

export class FailedPostgresWriteAssertionError extends Error {
  constructor(message = '') {
    super(message)
    this.name = this.constructor.name
    Object.setPrototypeOf(this, FailedPostgresWriteAssertionError.prototype)
  }
}

export function appErrorHandler(app: FastifyInstance) {
  return async function (
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    let statusCode = error.validation ? 400 : 500
    const message = error.message
    let payload: unknown = error.validation

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status
      // TODO: may need to filter out sensitive data
      payload = error.response?.data
    } else if (error instanceof HttpError) {
      statusCode = error.statusCode
    } else if (error instanceof UserError) {
      statusCode = error.statusCode
    }

    if (statusCode >= 500) {
      app.log.error(error)
    } else {
      app.log.info(error)
    }

    reply.status(statusCode)

    return reply.send({
      error: statusCode,
      message,
      payload,
    })
  }
}
