import {
  ClaimFreePack,
  ClaimPack,
  ClaimRedeemPack,
  Locale,
  LocaleAndExternalId,
  MintPack,
  OwnerExternalId,
  PackId,
  PacksByOwnerQuery,
  PackTemplateId,
  PublishedPacksQuery,
  RedeemCode,
  RevokePack,
  TransferPack,
} from '@algomart/schemas'
import { PacksService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getPublishedPacks(
  request: FastifyRequest<{
    Querystring: PublishedPacksQuery
  }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.getPublishedPacks(request.query)
  reply.send(result)
}

export async function getPacksByOwner(
  request: FastifyRequest<{
    Params: OwnerExternalId
    Querystring: PacksByOwnerQuery
  }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.getPacksByOwner({
    ...request.params,
    ...request.query,
  })
  reply.send(result)
}

export async function getPackWithCollectiblesById(
  request: FastifyRequest<{
    Params: PackId
    Querystring: Locale
  }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.getPackWithCollectiblesById(
    request.params.packId,
    request.query.locale
  )
  reply.send(result)
}

export async function getAuctionPackByTemplateId(
  request: FastifyRequest<{
    Params: PackTemplateId
  }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.getAuctionPackByTemplateId(
    request.params.templateId
  )
  reply.send(result)
}

export async function getRedeemablePack(
  request: FastifyRequest<{ Params: RedeemCode; Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.getPackByRedeemCode(
    request.params.redeemCode,
    request.query.locale
  )
  reply.send({ pack: result })
}

export async function untransferredPacks(
  request: FastifyRequest<{ Querystring: LocaleAndExternalId }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.untransferredPacks(request.query)
  reply.send(result)
}

export async function claimRandomFreePack(
  request: FastifyRequest<{ Body: ClaimFreePack }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.claimRandomFreePack(
    request.body,
    request.transaction
  )
  reply.send({ pack: result })
}

export async function claimRedeemPack(
  request: FastifyRequest<{ Body: ClaimRedeemPack; Querystring: Locale }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.claimRedeemPack(
    request.body,
    request.query.locale,
    request.transaction
  )
  if (!result) {
    reply.notFound()
    return
  }

  reply.send({ pack: result })
}

export async function claimPack(
  request: FastifyRequest<{ Body: ClaimPack }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.claimPack(request.body, request.transaction)
  if (!result) {
    reply.badRequest('Unable to claim pack')
    return
  }
  reply.send({ pack: result })
}

export async function mintPackStatus(
  request: FastifyRequest<{ Querystring: MintPack }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const status = await service.getPackMintingStatus(request.query)
  reply.send({
    status,
  })
}

export async function revokePack(
  request: FastifyRequest<{ Body: RevokePack }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.revokePack(request.body, request.transaction)
  if (!result) {
    reply.badRequest('Unable to revoke pack')
    return
  }
  reply.status(204).send()
}

export async function transferPack(
  request: FastifyRequest<{ Body: TransferPack }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  await service.transferPack(request.body, request.transaction)
  reply.status(204).send()
}

export async function transferPackStatus(
  request: FastifyRequest<{ Params: PackId }>,
  reply: FastifyReply
) {
  const service = request.getContainer().get<PacksService>(PacksService.name)
  const result = await service.transferPackStatus(request.params.packId)
  reply.send(result)
}
