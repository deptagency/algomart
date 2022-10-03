import {
  ClaimFreePack,
  ClaimRedeemPack,
  Language,
  PackId,
  PacksByOwnerQuery,
  PackSlug,
  PackTemplateId,
  PublishedPacksQuery,
  RedeemCode,
} from '@algomart/schemas'
import { generateCacheKey } from '@algomart/shared/plugins'
import { PacksService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getPackWithCollectiblesById(
  request: FastifyRequest<{
    Params: PackId
    Querystring: Language
  }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.getPackWithCollectiblesById(
    request.params.packId,
    request.query.language
  )
  return reply.send(result)
}

export async function getAuctionPackByTemplateId(
  request: FastifyRequest<{
    Params: PackTemplateId
  }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.getAuctionPackByTemplateId(
    request.params.templateId
  )
  return reply.send(result)
}

export async function getRedeemablePack(
  request: FastifyRequest<{ Params: RedeemCode; Querystring: Language }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.getPackByRedeemCode(
    request.params.redeemCode,
    request.query.language
  )
  return reply.send({ pack: result })
}

export async function searchPublishedPacks(
  request: FastifyRequest<{
    Querystring: PublishedPacksQuery
  }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const packs = await service.searchPublishedPacks(request.query)
  const cacheKey = generateCacheKey(
    'pack-search',
    Object.keys(request.query)
      .sort()
      .map((key) => {
        return `${key.toLowerCase()}-${request.query[key]}`
      })
  )

  return reply.cache(cacheKey).send(packs)
}

export async function getPublishedPackBySlug(
  request: FastifyRequest<{
    Params: PackSlug
    Querystring: Language
  }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const pack = await service.getPublishedPackBySlug(
    request.params.packSlug,
    request.query.language
  )
  const cacheKey = generateCacheKey('pack-slug', [
    request.params.packSlug,
    request.query.language,
  ])

  return reply.cache(cacheKey).send(pack)
}

export async function getPacksByOwner(
  request: FastifyRequest<{
    Querystring: PacksByOwnerQuery
  }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.getPacksByOwner(request.user, {
    ...request.query,
  })
  return reply.send(result)
}

export async function claimRandomFreePack(
  request: FastifyRequest<{ Body: ClaimFreePack }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const pack = await service.claimRandomFreePack(request.user, request.body)

  return reply.send({ pack })
}

export async function claimRedeemPack(
  request: FastifyRequest<{ Body: ClaimRedeemPack }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const pack = await service.claimRedeemablePack(request.user, request.body)

  return reply.send({ pack })
}

export async function transferPackStatus(
  request: FastifyRequest<{ Params: PackId }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.transferPackStatus(
    request.user,
    request.params.packId
  )
  return reply.send(result)
}
