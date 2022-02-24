import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FastifyError } from 'fastify-error'
import { HTTPError } from 'got'
import { HttpError } from 'http-errors'

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Indicates that the error was handled by custom error handler.
     */
    customError?: Error
  }
}

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

    /**
     *  If the error handler does not pass the error to the reply,
     *  the onError hook will not be called.
     *
     *  For requests that use transactions ({transact: true}), we want to know there was and error
     *  and rollback the transaction.
     *
     *  https://www.fastify.io/docs/latest/Reference/Hooks/#onerror
     *  This hook will be executed only after the customErrorHandler has been executed,
     *  and only if the customErrorHandler sends an error back to the user
     *
     *  example:
     *     reply.send(error) // triggers onError
     *     reply.status(statusCode).send({ statusCode, error: error.name, message: error.message }) // does not trigger onError
     */
    request.customError = error

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
