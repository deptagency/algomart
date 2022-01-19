import { Slug } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import SetsService from './sets.service'

export async function getSet(
  request: FastifyRequest<{ Params: Slug }>,
  reply: FastifyReply
) {
  const setsService = request.getContainer().get<SetsService>(SetsService.name)
  // TODO: get locale from request
  const set = await setsService.getBySlug(request.params.slug)

  if (set) reply.send(set)
  else reply.notFound()
}
