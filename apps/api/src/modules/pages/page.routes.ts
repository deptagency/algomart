import { Locale } from '@algomart/schemas'
import { DirectusPageService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getPage(
  request: FastifyRequest<{ Querystring: Locale & { slug: string } }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<DirectusPageService>(DirectusPageService.name)
  const page = await service.getPage(request.query.slug, request.query.locale)
  reply.send(page)
}
