import {
  AlgoAddress,
  AlgorandAssetIndexParameter,
  AlgorandSendRawTransactionParams,
  AlgorandTransactionParameter,
} from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function lookupAccount(
  request: FastifyRequest<{ Querystring: AlgoAddress }>,
  reply: FastifyReply
) {
  const account = await request
    .getContainer()
    .get<AlgorandAdapter>(AlgorandAdapter.name)
    .getAccountInfo(request.query.address)

  return reply.status(200).send(account)
}

export async function lookupAsset(
  request: FastifyRequest<{ Querystring: AlgorandAssetIndexParameter }>,
  reply: FastifyReply
) {
  const asset = await request
    .getContainer()
    .get<AlgorandAdapter>(AlgorandAdapter.name)
    .getAssetInfo(request.query.assetIndex)

  return reply.status(200).send(asset)
}

export async function lookupTransaction(
  request: FastifyRequest<{ Querystring: AlgorandTransactionParameter }>,
  reply: FastifyReply
) {
  const transaction = await request
    .getContainer()
    .get<AlgorandAdapter>(AlgorandAdapter.name)
    .getTransactionInfo(request.query.txID)

  return reply.status(200).send(transaction)
}

export async function getTransactionParams(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const transactionParams = await request
    .getContainer()
    .get<AlgorandAdapter>(AlgorandAdapter.name)
    .getTransactionParams()

  return reply.status(200).send(transactionParams)
}

export async function sendRawTransaction(
  request: FastifyRequest<{ Body: AlgorandSendRawTransactionParams }>,
  reply: FastifyReply
) {
  const txId = await request
    .getContainer()
    .get<AlgorandAdapter>(AlgorandAdapter.name)
    .sendRawTransaction(request.body.transaction)

  return reply.status(200).send(txId)
}
