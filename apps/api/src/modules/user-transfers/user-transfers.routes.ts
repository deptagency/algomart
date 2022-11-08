import { UserAccountTransfersQuery } from '@algomart/schemas'
import { UserAccountTransfersService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getUserAccountTransferById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userAccountTransferService = request
    .getContainer()
    .get<UserAccountTransfersService>(UserAccountTransfersService.name)
  const transfer = await userAccountTransferService.getUserAccountTransferById(
    request.params.id
  )
  return reply.send(transfer)
}

export async function getUserAccountTransferByEntityId(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userAccountTransferService = request
    .getContainer()
    .get<UserAccountTransfersService>(UserAccountTransfersService.name)

  const transfer =
    await userAccountTransferService.getUserAccountTransferByEntityId(
      request.user,
      request.params.id
    )

  return transfer ? reply.send(transfer) : reply.notFound()
}

export async function searchTransfers(
  request: FastifyRequest<{
    Querystring: UserAccountTransfersQuery
  }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<UserAccountTransfersService>(UserAccountTransfersService.name)

  const transfers = await service.searchTransfers(request.user, request.query)

  return transfers ? reply.send(transfers) : reply.notFound()
}
