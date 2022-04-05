import { Slug } from '@algomart/schemas'
import { SetsService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getSet(
  request: FastifyRequest<{ Params: Slug }>,
  reply: FastifyReply
) {
  const setsService = request.getContainer().get<SetsService>(SetsService.name)
  // TODO: get language from request
  const set = await setsService.getBySlug(request.params.slug)

  if (set) reply.send(set)
  else reply.notFound()
}
