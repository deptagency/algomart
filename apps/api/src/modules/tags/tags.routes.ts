import { TagListQuery, TagQuery } from '@algomart/schemas'
import { TagsService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function searchTags(
  request: FastifyRequest<{ Params: TagQuery }>,
  reply: FastifyReply
) {
  const tagsService = request.getContainer().get<TagsService>(TagsService.name)

  const tags = await tagsService.searchTags(request.params)

  return reply.send(tags)
}

export async function listTagsBySlugs(
  request: FastifyRequest<{ Querystring: TagListQuery }>,
  reply: FastifyReply
) {
  const tagsService = request.getContainer().get<TagsService>(TagsService.name)

  const tags = await tagsService.listTagsBySlugs(request.query)

  return reply.send(tags)
}
