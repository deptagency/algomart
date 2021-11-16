import {
  BankAccountId,
  CardId,
  CreateBankAccount,
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

export async function getWireTransferInstructions(
  request: FastifyRequest<{
    Params: BankAccountId
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const bankAccount = await paymentService.getWireTransferInstructions(
    request.params.bankAccountId
  )
  if (bankAccount) {
    reply.send(bankAccount)
  } else {
    reply.notFound()
  }
}

export async function getBankAccountStatus(
  request: FastifyRequest<{
    Params: BankAccountId
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const bankAccount = await paymentService.getBankAccountStatus(
    request.params.bankAccountId
  )
  if (bankAccount) {
    reply.send(bankAccount)
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

export async function createBankAccount(
  request: FastifyRequest<{
    Body: CreateBankAccount
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const bankAccount = await paymentService.createBankAccount(
    request.body,
    request.transaction
  )
  if (bankAccount) {
    reply.status(201).send(bankAccount)
  } else {
    reply.badRequest('Unable to create bank account')
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
