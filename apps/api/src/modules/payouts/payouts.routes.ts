import {
  InitiateUsdcPayoutRequest,
  InitiateWirePayoutRequest,
  UserExternalIdObject,
} from '@algomart/schemas'
import { PayoutService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getBalanceAvailableForPayout(
  request: FastifyRequest<{
    Querystring: UserExternalIdObject
  }>
) {
  const payoutService = request
    .getContainer()
    .get<PayoutService>(PayoutService.name)
  return await payoutService.getBalanceAvailableForPayout(request.user)
}

export async function initiateUsdcPayout(
  request: FastifyRequest<{
    Body: InitiateUsdcPayoutRequest
  }>,
  reply: FastifyReply
) {
  const payoutService = request
    .getContainer()
    .get<PayoutService>(PayoutService.name)
  const result = await payoutService.initiateUsdcPayout(
    request.user,
    request.body
  )

  return reply.status(201).send(result)
}

export async function initiateWirePayout(
  request: FastifyRequest<{
    Body: InitiateWirePayoutRequest
  }>,
  reply: FastifyReply
) {
  const payoutService = request
    .getContainer()
    .get<PayoutService>(PayoutService.name)
  const result = await payoutService.initiateWirePayout(
    request.user,
    request.body
  )

  return reply.status(201).send(result)
}
