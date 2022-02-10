import { Locale } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import DirectusPageService from './page.service'

export async function getDirectusPage(
  request: FastifyRequest<{ Querystring: Locale & { slug: string } }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<DirectusPageService>(DirectusPageService.name)
  const page = await service.getDirectusPage(
    request.query.slug,
    request.query.locale
  )
  reply.send(page)
}
