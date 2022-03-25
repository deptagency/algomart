import { CreateAuctionBody, SetupAuctionBody } from '@algomart/schemas'
import { AuctionsService } from '@algomart/shared/services'
import { Configuration } from '@api/configuration'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function createAuction(
  request: FastifyRequest<{ Body: CreateAuctionBody }>,
  reply: FastifyReply
) {
  if (!Configuration.enableMarketplace) {
    reply.status(501).send('Marketplace is not implemented yet')
    return
  }

  const service = request
    .getContainer()
    .get<AuctionsService>(AuctionsService.name)

  const result = await service.createAuction(
    request.body,
    5,
    request.transaction
  )

  reply.send(result)
}

export async function setupAuction(
  request: FastifyRequest<{ Body: SetupAuctionBody }>,
  reply: FastifyReply
) {
  if (!Configuration.enableMarketplace) {
    reply.status(501).send('Marketplace is not implemented yet')
    return
  }

  const service = request
    .getContainer()
    .get<AuctionsService>(AuctionsService.name)

  const result = await service.setupAuction(request.body, request.transaction)

  reply.send(result)
}
