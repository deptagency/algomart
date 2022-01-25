import { CreateAuctionBody } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import AuctionsService from './auctions.service'

import { Configuration } from '@/configuration'

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

  await service.createAuction(request.body)

  reply.status(201).send()
}
