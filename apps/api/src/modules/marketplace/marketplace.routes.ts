import {
  CollectibleListingsQuery,
  IdParameter,
  ListCollectibleForSale,
} from '@algomart/schemas'
import { generateCacheKey } from '@algomart/shared/plugins'
import { MarketplaceService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getListingById(
  request: FastifyRequest<{ Params: IdParameter }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<MarketplaceService>(MarketplaceService.name)

  const listing = await service.getListingById(request.params.id)

  return reply.send(listing)
}

export async function createListing(
  request: FastifyRequest<{ Body: ListCollectibleForSale }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<MarketplaceService>(MarketplaceService.name)

  const listing = await service.createListing(request.user, request.body)

  return reply.status(201).send(listing)
}

export async function searchListings(
  request: FastifyRequest<{
    Querystring: CollectibleListingsQuery
  }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<MarketplaceService>(MarketplaceService.name)

  const listings = await service.searchListings(request.query)

  const cacheKey = generateCacheKey(
    'collectible-listing-search',
    Object.keys(request.query)
      .sort()
      .map((key) => {
        return `${key.toLowerCase()}-${request.query[key]}`
      })
  )

  return reply.cache(cacheKey).send(listings)
}

export async function delistCollectible(
  request: FastifyRequest<{ Params: IdParameter }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<MarketplaceService>(MarketplaceService.name)

  await service.delistCollectible(request.user.id, {
    listingId: request.params.id,
  })

  return reply.status(204).send()
}

export async function purchaseListingWithCredits(
  request: FastifyRequest<{ Params: IdParameter }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<MarketplaceService>(MarketplaceService.name)

  const transfer = await service.purchaseListingWithCredits(
    request.user.id,
    request.params.id
  )

  return reply.send(transfer)
}
