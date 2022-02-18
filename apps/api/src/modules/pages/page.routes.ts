import { Locale } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import PageService from './page.service'

export async function getPage(
  request: FastifyRequest<{ Querystring: Locale & { slug: string } }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PageService>(PageService.name)
  const page = await service.getPage(request.query.slug, request.query.locale)
  reply.send(page)
}
