import { CreateAuctionBody } from '@algomart/schemas'
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

  await service.createAuction(request.body, 5, request.transaction)

  reply.status(201).send()
}
