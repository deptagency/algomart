import {
  AssetIdObject,
  CollectibleId,
  CollectibleQuery,
  CollectibleShowcaseQuery,
  CollectiblesQuery,
  CollectibleUniqueCode,
  InitializeTransferCollectible,
  Language,
  TransferCollectible,
} from '@algomart/schemas'
import { generateCacheKey } from '@algomart/shared/plugins'
import { CollectiblesService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function searchCollectibles(
  request: FastifyRequest<{
    Querystring: CollectiblesQuery
  }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const collectibles = await collectiblesService.searchCollectibles(
    request.query
  )

  const cacheKey = generateCacheKey(
    'collectible-search',
    Object.keys(request.query)
      .sort()
      .map((key) => {
        return `${key.toLowerCase()}-${request.query[key]}`
      })
  )

  return reply.cache(cacheKey).send(collectibles)
}

export async function getCollectible(
  request: FastifyRequest<{ Querystring: CollectibleQuery }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const collectible = await collectiblesService.getCollectible(request.query)

  return reply.send(collectible)
}

export async function getCollectibleTemplateByUniqueCode(
  request: FastifyRequest<{
    Params: CollectibleUniqueCode
    Querystring: Language
  }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const collectibleTemplate =
    await collectiblesService.getCollectibleTemplateByUniqueCode({
      ...request.query,
      ...request.params,
    })

  return reply.send(collectibleTemplate)
}

export async function getCollectibleActivities(
  request: FastifyRequest<{ Querystring: AssetIdObject }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const activities = await collectiblesService.getActivities(
    request.query.assetId
  )

  return reply.send(activities)
}

export async function getShowcaseCollectibles(
  request: FastifyRequest<{ Querystring: CollectibleShowcaseQuery }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const result = await collectiblesService.getShowcaseCollectibles(
    request.query
  )

  return reply.send(result)
}

export async function addCollectibleShowcase(
  request: FastifyRequest<{
    Body: CollectibleId
  }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const { collectibleId } = request.body

  await collectiblesService.addShowcaseCollectible(request.user, {
    collectibleId,
  })

  return reply.status(204).send()
}

export async function removeCollectibleShowcase(
  request: FastifyRequest<{
    Body: CollectibleId
  }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const { collectibleId } = request.body

  await collectiblesService.removeShowcaseCollectible(request.user, {
    collectibleId,
  })

  return reply.status(204).send()
}

export async function initializeExportCollectible(
  request: FastifyRequest<{ Body: InitializeTransferCollectible }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const result = await collectiblesService.initializeExportCollectible(
    request.body
  )

  return reply.send(result)
}

export async function exportCollectible(
  request: FastifyRequest<{ Body: TransferCollectible }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const txId = await collectiblesService.exportCollectible(request.body)

  return reply.send({
    txId,
  })
}

export async function initializeImportCollectible(
  request: FastifyRequest<{ Body: InitializeTransferCollectible }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const transaction = await collectiblesService.initializeImportCollectible(
    request.body
  )

  return reply.send(transaction)
}

export async function importCollectible(
  request: FastifyRequest<{ Body: TransferCollectible }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const txId = await collectiblesService.importCollectible(request.body)

  return reply.send({
    txId,
  })
}
