import { CreateBidRequest } from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import BidsService from '@/modules/bids/bids.service'

export async function createBid(
  request: FastifyRequest<{ Body: CreateBidRequest }>,
  reply: FastifyReply
) {
  const bidsService = request.getContainer().get<BidsService>(BidsService.name)
  const bid = await bidsService.createBid(request.body, request.transaction)
  if (bid) {
    reply.status(204).send()
  } else {
    reply.badRequest('bid could not be created')
  }
}
