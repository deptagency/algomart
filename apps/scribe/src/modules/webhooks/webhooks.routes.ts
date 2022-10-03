import { DirectusWebhook } from '@algomart/schemas'
import { CMSCacheService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function processRequestDirectus(
  request: FastifyRequest<{ Body: DirectusWebhook }>,
  reply: FastifyReply
) {
  const cmsCache = request
    .getContainer()
    .get<CMSCacheService>(CMSCacheService.name)

  cmsCache.processWebhook(request.body)

  return reply.send(200)
}
