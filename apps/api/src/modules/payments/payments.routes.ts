import {
  CardId,
  CreateCard,
  CreateCcPayment,
  CreateUsdcPayment,
  PaymentId,
  PaymentsQuerystring,
  PaymentStatus,
  PurchasePackWithCredits,
  UpdatePaymentCard,
} from '@algomart/schemas'
import { generateCacheKey } from '@algomart/shared/plugins'
import { PaymentCardService, PaymentsService } from '@algomart/shared/services'
import { getIPAddress } from '@algomart/shared/utils'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getPublicKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const publicKey = await paymentService.getPublicKey()
  const cacheKey = generateCacheKey('encryption-public-key')
  return reply.cache(cacheKey).send(publicKey)
}

export async function getCardStatus(
  request: FastifyRequest<{
    Params: CardId
  }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<PaymentCardService>(PaymentCardService.name)
  const card = await service.getCardStatus(request.user, request.params.cardId)
  return card ? reply.send(card) : reply.notFound()
}

export async function getCards(request: FastifyRequest, reply: FastifyReply) {
  const service = request
    .getContainer()
    .get<PaymentCardService>(PaymentCardService.name)
  const cards = await service.getActivePaymentCards(request.user.id)
  return cards ? reply.send(cards) : reply.notFound()
}

export async function createCard(
  request: FastifyRequest<{
    Body: CreateCard
  }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<PaymentCardService>(PaymentCardService.name)
  const card = await service.savePaymentCard(
    request.user,
    request.body,
    getIPAddress(request)
  )
  return reply.status(201).send(card)
}

export async function updateCard(
  request: FastifyRequest<{
    Params: CardId
    Body: UpdatePaymentCard
  }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<PaymentCardService>(PaymentCardService.name)
  await service.updatePaymentCard(
    request.user,
    request.params.cardId,
    request.body
  )
  return reply.status(204).send()
}

export async function removeCard(
  request: FastifyRequest<{
    Params: CardId
  }>,
  reply: FastifyReply
) {
  const service = request
    .getContainer()
    .get<PaymentCardService>(PaymentCardService.name)
  await service.removePaymentCard(request.user, request.params.cardId)
  return reply.status(204).send()
}

export async function createWalletAddress(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)

  const address = await paymentService.generateBlockchainAddressForUsdcDeposit(
    request.user
  )

  return reply.status(201).send(address)
}

export async function createCcPayment(
  request: FastifyRequest<{
    Body: CreateCcPayment
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payment = await paymentService.createCcPayment(request.user, {
    ...request.body,
    metadata: {
      ...request.body.metadata,
      ipAddress: getIPAddress(request),
    },
  })
  return reply.send(payment)
}

export async function createUsdcPayment(
  request: FastifyRequest<{
    Body: CreateUsdcPayment
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payment = await paymentService.createUsdcPayment(
    request.user,
    request.body
  )
  return payment
    ? reply.status(201).send(payment)
    : reply.badRequest('Unable to create transfer payment')
}

export async function purchasePackWithCredits(
  request: FastifyRequest<{
    Body: PurchasePackWithCredits
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const transfer = await paymentService.purchasePackWithCredits(
    request.body,
    request.user
  )
  return reply.status(201).send(transfer)
}

export async function getPaymentById(
  request: FastifyRequest<{
    Params: PaymentId
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payment = await paymentService.getPaymentById(
    request.user.id,
    request.params.paymentId
  )
  return payment ? reply.status(200).send(payment) : reply.notFound()
}

export async function getPayments(
  request: FastifyRequest<{
    Querystring: PaymentsQuerystring
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payments = await paymentService.getPayments(request.user, request.query)
  return reply.status(200).send(payments)
}

export async function getPaymentsMissingTransfers(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paymentsService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payments = await paymentsService.getPaymentsMissingTransfersForUser(
    request.user.id
  )
  return reply.status(200).send(payments)
}

export async function findTransferByPaymentId(
  request: FastifyRequest<{
    Params: PaymentId
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)

  const [transfer, payment] = await Promise.all([
    paymentService.findTransferByPaymentId(
      request.user,
      request.params.paymentId
    ),
    paymentService.getPaymentById(request.user.id, request.params.paymentId),
  ])

  if (transfer) {
    return reply.status(200).send(transfer)
  } else if (
    !payment ||
    ![
      PaymentStatus.Pending,
      PaymentStatus.ActionRequired,
      PaymentStatus.Confirmed,
      PaymentStatus.Paid,
    ].includes(payment.status)
  ) {
    // return a conflict error to indicate that we can expect this endpoint to never return a
    // transfer if retried for the same payment ID.
    return reply.conflict()
  } else {
    // otherwise return not found so the client knows to retry later.
    return reply.notFound()
  }
}
