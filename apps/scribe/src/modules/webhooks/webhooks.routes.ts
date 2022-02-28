import { DirectusWebhook } from '@algomart/schemas'
import { DirectusAdapter } from '@algomart/shared/adapters'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function processRequest(
  request: FastifyRequest<{ Body: DirectusWebhook }>,
  reply: FastifyReply
) {
  const directus = request
    .getContainer()
    .get<DirectusAdapter>(DirectusAdapter.name)

  directus.processWebhook(request.body)

  reply.send(200)
}
