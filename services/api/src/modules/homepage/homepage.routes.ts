import { Locale } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import HomepageService from './homepage.service'

export async function getHomepage(
  request: FastifyRequest<{ Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<HomepageService>(HomepageService.name)
  const homepage = await service.getHomepage(request.query.locale)
  reply.send(homepage)
}
