import { Language } from '@algomart/schemas'
import { generateCacheKey } from '@algomart/shared/plugins'
import { HomepageService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getHomepage(
  request: FastifyRequest<{ Querystring: Language }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<HomepageService>(HomepageService.name)

  const homepage = await service.getHomepage(request.query.language)
  const cacheKey = generateCacheKey('homepage', [request.query.language])

  return reply.cache(cacheKey, 3600).send(homepage)
}
