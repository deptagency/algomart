import { Slug } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import CollectionsService from './collections.service'

export async function getAllCollections(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const collectionsService = request
    .getContainer()
    .get<CollectionsService>(CollectionsService.name)
  // TODO: get locale from request
  const collections = await collectionsService.getAllCollections()
  reply.send(collections)
}

export async function getCollection(
  request: FastifyRequest<{ Params: Slug }>,
  reply: FastifyReply
) {
  const collectionsService = request
    .getContainer()
    .get<CollectionsService>(CollectionsService.name)
  // TODO: get locale from request
  const collection = await collectionsService.getCollectionBySlug(
    request.params.slug
  )

  if (collection) reply.send(collection)
  else reply.notFound()
}
