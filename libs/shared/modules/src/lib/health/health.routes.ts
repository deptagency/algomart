import { verify } from 'crypto'
import { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Used to generate a route for checking health status
 *
 * @param verifyFn - (optional) pass in a custom function that can implement
 * whatever custom checks makes sense for your particular service (eg. checking a
 * db connection, etc)
 */
export function generateHealthRoute(verifyFn?: () => Promise<string>) {
  return async (request: FastifyRequest<unknown>, reply: FastifyReply) => {
    verifyFn = verifyFn ?? (async () => undefined)

    const errorStr = await verifyFn()
    if (errorStr ?? undefined === undefined) {
      reply.send({ status: 'healthy' })
    }

    reply.status(500).send({ status: `Service Unhealthy: ${errorStr}` })
  }
}
