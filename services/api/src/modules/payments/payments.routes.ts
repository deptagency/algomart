import {
  CardId,
  CreateCard,
  CreatePayment,
  OwnerExternalId,
  PaymentId,
  UpdatePaymentCard,
} from '@algomart/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'

import PaymentsService from './payments.service'

export async function getPublicKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  reply.send(await paymentService.getPublicKey())
}

export async function getCardStatus(
  request: FastifyRequest<{
    Params: CardId
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const card = await paymentService.getCardStatus(request.params.cardId)
  if (card) {
    reply.send(card)
  } else {
    reply.notFound()
  }
}

export async function getCards(
  request: FastifyRequest<{
    Querystring: OwnerExternalId
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  if (!request.query.ownerExternalId) {
    reply.badRequest('ownerExternalId must be set')
    return
  }
  const cards = await paymentService.getCards(request.query)
  if (cards) {
    reply.send(cards)
  } else {
    reply.notFound()
  }
}

export async function createCard(
  request: FastifyRequest<{
    Body: CreateCard
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const card = await paymentService.createCard(
    request.body,
    request.transaction
  )
  if (card) {
    reply.status(201).send(card)
  } else {
    reply.badRequest('Unable to create card')
  }
}

export async function updateCard(
  request: FastifyRequest<{
    Params: CardId
    Body: UpdatePaymentCard
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  await paymentService.updateCard(request.params.cardId, request.body)
  reply.status(204).send()
}

export async function removeCard(
  request: FastifyRequest<{
    Params: CardId
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  await paymentService.removeCardById(request.params.cardId)
  reply.status(204).send()
}

export async function createPayment(
  request: FastifyRequest<{
    Body: CreatePayment
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payment = await paymentService.createPayment(
    request.body,
    request.transaction
  )
  if (payment) {
    reply.status(201).send(payment)
  } else {
    reply.badRequest('Unable to create payment')
  }
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
  const payment = await paymentService.getPaymentById(request.params.paymentId)
  if (payment) {
    reply.status(200).send(payment)
  } else {
    reply.notFound()
  }
}

export async function getCurrency(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  reply.send(await paymentService.getCurrency())
}
