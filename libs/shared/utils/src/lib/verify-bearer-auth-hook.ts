import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify'

/**
 * Use this in place of the `@fastify/bearer-auth` module if you only want a
 * single route to check for a bearer token.
 *
 * @param allowedAPIKeys Array of allowed API keys
 * @returns Fastify onRequest hook handler
 */
export function verifyBearerAuth(allowedAPIKeys: string[]) {
  return (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    if (allowedAPIKeys.length === 0) {
      done()
      return
    }

    const { authorization } = request.headers
    if (!authorization) {
      reply.status(401).send({ error: 'Missing authorization header' })
      return reply
    }

    const [, token] = authorization.match(/bearer\s+(\S+)/i)
    if (!allowedAPIKeys.includes(token)) {
      reply.status(401).send({ error: 'Invalid authorization header' })
      return reply
    }

    done()
  }
}
