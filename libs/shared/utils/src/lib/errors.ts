import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyError } from '@fastify/error'
import { HttpError } from 'http-errors'

export class UserError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    Object.setPrototypeOf(this, UserError.prototype)
  }
}

export function appErrorHandler(app: FastifyInstance) {
  return async function (
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    let statusCode = 500

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status
    } else if (error instanceof HttpError) {
      statusCode = error.response.statusCode
    } else if (error instanceof UserError) {
      statusCode = error.statusCode
    }

    if (statusCode >= 500) {
      app.log.error(error)
    } else {
      app.log.info(error)
    }

    reply.status(statusCode)

    throw error
  }
}
