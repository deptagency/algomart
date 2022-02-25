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
    if (error instanceof HTTPError || error instanceof HttpError) {
      reply.status(error.response.statusCode)
    }
    throw error
  }
}
