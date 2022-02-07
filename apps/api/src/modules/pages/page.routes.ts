import { Locale } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import DirectusPageService from './page.service'

export async function getDirectusPage(
  request: FastifyRequest<{ Querystring: Locale & { title: string } }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<DirectusPageService>(DirectusPageService.name)
  const page = await service.getDirectusPage(
    request.query.title,
    request.query.locale
  )
  reply.send(page)
}
