import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyError } from 'fastify-error'
import { HTTPError } from 'got'
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
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    let statusCode = 500

    if (error instanceof HTTPError || error instanceof HttpError) {
      statusCode = error.response.statusCode
    } else if (error instanceof UserError) {
      statusCode = error.statusCode
    }

    if (statusCode >= 500) {
      app.log.error(error)
    } else {
      app.log.info(error)
    }

    // Send error response
    if (error instanceof HTTPError) {
      // errors from got
      reply
        .status(statusCode)
        .type('application/json')
        .send(error.response.body)
    } else {
      // everything else
      reply.status(statusCode).send({
        statusCode,
        error: error.name,
        message: error.message,
      })
    }
  }
}
