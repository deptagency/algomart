import {
  AlgoAddress,
  CollectibleId,
  CollectibleListQuerystring,
  CollectiblesByAlgoAddressQuerystring,
  CollectibleShowcaseQuerystring,
  ExportCollectible,
  SingleCollectibleQuerystring,
} from '@algomart/schemas'
import { CollectiblesService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getCollectibles(
  request: FastifyRequest<{
    Querystring: CollectibleListQuerystring
  }>,
  reply: FastifyReply
) {
  const collectibles = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  if (!(request.query.ownerExternalId || request.query.ownerUsername)) {
    reply.badRequest('ownerUsername or ownerExternalId must be set')
    return
  }

  const collectiblesForAccount = await collectibles.getCollectibles(
    request.query,
    request.knexRead
  )

  if (!collectiblesForAccount) {
    reply.notFound()
  } else {
    reply.send(collectiblesForAccount)
  }
}

export async function getCollectible(
  request: FastifyRequest<{ Querystring: SingleCollectibleQuerystring }>,
  reply: FastifyReply
) {
  const collectibles = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const collectible = await collectibles.getCollectible(
    request.query,
    request.knexRead
  )

  reply.send(collectible)
}

export async function getCollectiblesByAlgoAddress(
  request: FastifyRequest<{
    Params: AlgoAddress
    Querystring: CollectiblesByAlgoAddressQuerystring
  }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const result = await collectiblesService.getCollectiblesByAlgoAddress(
    request.params.algoAddress,
    request.query,
    request.knexRead
  )

  reply.send(result)
}

export async function getShowcaseCollectibles(
  request: FastifyRequest<{ Querystring: CollectibleShowcaseQuerystring }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const result = await collectiblesService.getShowcaseCollectibles(
    request.query,
    request.knexRead
  )

  reply.send(result)
}

export async function addCollectibleShowcase(
  request: FastifyRequest<{
    Querystring: CollectibleShowcaseQuerystring
    Body: CollectibleId
  }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  await collectiblesService.addShowcaseCollectible(
    {
      ...request.body,
      ...request.query,
    },
    request.transaction,
    request.knexRead
  )

  reply.status(204).send()
}

export async function removeCollectibleShowcase(
  request: FastifyRequest<{
    Querystring: CollectibleShowcaseQuerystring
    Body: CollectibleId
  }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  await collectiblesService.removeShowcaseCollectible(
    {
      ...request.body,
      ...request.query,
    },
    request.transaction,
    request.knexRead
  )

  reply.status(204).send()
}

export async function exportCollectible(
  request: FastifyRequest<{ Body: ExportCollectible }>,
  reply: FastifyReply
) {
  const collectiblesService = request
    .getContainer()
    .get<CollectiblesService>(CollectiblesService.name)

  const txId = await collectiblesService.exportCollectible(
    request.body,
    request.transaction,
    request.knexRead
  )

  reply.send({
    txId,
  })
}
