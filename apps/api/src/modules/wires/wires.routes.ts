import {
  CreateWireBankAccountRequest,
  PatchWireBankAccount,
  WireBankAccountIdParams,
} from '@algomart/schemas'
import { WiresService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function createWireBankAccount(
  request: FastifyRequest<{ Body: CreateWireBankAccountRequest }>,
  reply: FastifyReply
) {
  const wiresService = request
    .getContainer()
    .get<WiresService>(WiresService.name)

  const wireBankAccount = await wiresService.createBankAccount(
    request.user,
    request.body
  )

  return reply.status(201).send(wireBankAccount)
}

export async function getWireBankAccountStatus(
  request: FastifyRequest<{
    Params: WireBankAccountIdParams
  }>,
  reply: FastifyReply
) {
  const wiresService = request
    .getContainer()
    .get<WiresService>(WiresService.name)

  const statusInfo = await wiresService.getWireBankAccountStatus(
    request.user,
    request.params.wireBankAccountId
  )
  // service method will throw 404 if necessary
  return reply.send(statusInfo)
}

export async function updateWireBankAccount(
  request: FastifyRequest<{
    Params: WireBankAccountIdParams
    Body: PatchWireBankAccount
  }>,
  reply: FastifyReply
) {
  const wiresService = request
    .getContainer()
    .get<WiresService>(WiresService.name)

  await wiresService.updateWireBankAccount(
    request.user,
    request.params.wireBankAccountId,
    request.body
  )
  return reply.status(204).send()
}

export async function removeWireBankAccount(
  request: FastifyRequest<{
    Params: WireBankAccountIdParams
  }>,
  reply: FastifyReply
) {
  const wiresService = request
    .getContainer()
    .get<WiresService>(WiresService.name)

  await wiresService.removeWireBankAccount(
    request.user,
    request.params.wireBankAccountId
  )
  return reply.status(204).send()
}

export async function getWireInstructionsForBankAccount(
  request: FastifyRequest<{
    Params: WireBankAccountIdParams
  }>,
  reply: FastifyReply
) {
  const wiresService = request
    .getContainer()
    .get<WiresService>(WiresService.name)

  const wireInstructions = await wiresService.getWireInstructionsForBankAccount(
    request.user,
    request.params.wireBankAccountId
  )

  return reply.send(wireInstructions)
}

export async function getSavedWireBankAccounts(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const wiresService = request
    .getContainer()
    .get<WiresService>(WiresService.name)

  const wireBankAccounts = await wiresService.getSavedWireBankAccounts(
    request.user
  )

  return reply.send(wireBankAccounts)
}
