import { Language, Slug } from '@algomart/schemas'
import { SetsService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getSet(
  request: FastifyRequest<{ Params: Slug; Querystring: Language }>,
  reply: FastifyReply
) {
  const setsService = request.getContainer().get<SetsService>(SetsService.name)

  const set = await setsService.getBySlug(
    request.params.slug,
    request.query.language
  )

  return set ? reply.send(set) : reply.notFound()
}
