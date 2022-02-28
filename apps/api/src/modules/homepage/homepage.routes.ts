import { Locale } from '@algomart/schemas'
import { HomepageService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getHomepage(
  request: FastifyRequest<{ Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<HomepageService>(HomepageService.name)
  const homepage = await service.getHomepage(
    request.transaction,
    request.knexRead,
    request.query.locale
  )
  reply.send(homepage)
}
