import { CreateAuctionBody } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import AuctionsService from './auctions.service'

export async function createAuction(
  request: FastifyRequest<{ Body: CreateAuctionBody }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<AuctionsService>(AuctionsService.name)

  await service.createAuction(request.body)

  reply.status(201).send()
}
