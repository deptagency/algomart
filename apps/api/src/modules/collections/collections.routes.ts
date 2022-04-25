import { Language, Slug } from '@algomart/schemas'
import { CollectionsService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getAllCollections(
  request: FastifyRequest<{ Querystring: Language }>,
  reply: FastifyReply
) {
  const collectionsService = request
    .getContainer()
    .get<CollectionsService>(CollectionsService.name)
  const collections = await collectionsService.getAllCollections(
    request.query.language
  )
  reply.send(collections)
}

export async function getCollection(
  request: FastifyRequest<{ Params: Slug }>,
  reply: FastifyReply
) {
  const collectionsService = request
    .getContainer()
    .get<CollectionsService>(CollectionsService.name)
  const collection = await collectionsService.getCollectionBySlug(
    request.params.slug
  )

  if (collection) reply.send(collection)
  else reply.notFound()
}
