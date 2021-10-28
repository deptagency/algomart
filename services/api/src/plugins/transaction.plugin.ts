import {
  FastifyInstance,
  onErrorAsyncHookHandler,
  onSendAsyncHookHandler,
  preHandlerAsyncHookHandler,
} from 'fastify'
import fp from 'fastify-plugin'
import { Model, Transaction } from 'objection'

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * The transaction object for the current request. Only available if
     * `transact: true` has been set for this route.
     */
    transaction?: Transaction
    /**
     * Indicates that the transaction was rolled back.
     */
    transactionFailed?: boolean
  }

  interface RouteOptions {
    /**
     * If true, the route will be wrapped in a transaction. Only use for routes that mutate data.
     */
    transact?: boolean
  }

  interface RouteShorthandOptions {
    /**
     * If true, the route will be wrapped in a transaction. Only use for routes that mutate data.
     */
    transact?: boolean
  }
}

function addHandler(existingHandler: unknown, newHandler: unknown) {
  if (Array.isArray(existingHandler)) {
    return [...existingHandler, newHandler]
  } else if (typeof existingHandler === 'function') {
    return [existingHandler, newHandler]
  } else {
    return [newHandler]
  }
}

// Heavily inspired by https://github.com/fastify/fastify-postgres
export default fp(async function fastifyTransaction(fastify: FastifyInstance) {
  const preHandler: preHandlerAsyncHookHandler = async (request) => {
    fastify.log.info('start transaction')
    request.transaction = await Model.startTransaction()
  }

  const onError: onErrorAsyncHookHandler = async (request, _, error) => {
    fastify.log.error(error, 'rollback transaction')
    request.transactionFailed = true
    await request.transaction?.rollback()
  }

  const onSend: onSendAsyncHookHandler<unknown> = async (request) => {
    if (request.transactionFailed) return
    fastify.log.info('commit transaction')
    await request.transaction?.commit()
  }

  fastify.addHook('onRoute', (route) => {
    if (!route.transact) return
    route.preHandler = addHandler(route.preHandler, preHandler)
    route.onError = addHandler(route.onError, onError)
    route.onSend = addHandler(route.onSend, onSend)
  })
})
