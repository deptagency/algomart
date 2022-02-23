import {
  BankAccountId,
  CardId,
  CreateBankAccount,
  CreateCard,
  CreatePayment,
  CreateTransferPayment,
  CreateWalletAddress,
  FindTransferByAddress,
  OwnerExternalId,
  PaymentId,
  PaymentQuerystring,
  PaymentsQuerystring,
  SendBankAccountInstructions,
  UpdatePayment,
  UpdatePaymentCard,
} from '@algomart/schemas'
import { PaymentsService } from '@algomart/shared/services'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getPublicKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const publicKey = await paymentService.getPublicKey()
  if (publicKey) {
    reply.send(publicKey)
  } else {
    reply.notFound()
  }
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
  const card = await paymentService.getCardStatus(
    request.params.cardId,
    request.knexRead
  )
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
    request.params.bankAccountId,
    request.knexRead
  )
  if (bankAccount) {
    reply.send(bankAccount)
  } else {
    reply.notFound()
  }
}

export async function findWirePaymentsByBankId(
  request: FastifyRequest<{
    Params: BankAccountId
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payments = await paymentService.searchAllWirePaymentsByBankId(
    request.params.bankAccountId,
    request.knexRead
  )
  reply.send(payments)
}

export async function sendWireTransferInstructions(
  request: FastifyRequest<{
    Querystring: SendBankAccountInstructions
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  await paymentService.sendWireInstructions(
    request.query,
    request.transaction,
    request.knexRead
  )
  reply.status(204).send()
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
    request.params.bankAccountId,
    request.knexRead
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
  const cards = await paymentService.getCards(request.query, request.knexRead)
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
    request.transaction,
    request.knexRead
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
    request.transaction,
    request.knexRead
  )
  reply.status(201).send(card)
}

export async function createWalletAddress(
  request: FastifyRequest<{
    Body: CreateWalletAddress
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const address = await paymentService.generateAddress(request.body)
  if (address) {
    reply.status(201).send(address)
  } else {
    reply.badRequest('Unable to create wallet address')
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
  await paymentService.updateCard(
    request.params.cardId,
    request.body,
    request.transaction,
    request.knexRead
  )
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
  await paymentService.removeCardById(
    request.params.cardId,
    request.transaction,
    request.knexRead
  )
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
    request.transaction,
    request.knexRead
  )
  if (payment) {
    reply.status(201).send(payment)
  } else {
    reply.badRequest('Unable to create payment')
  }
}

export async function updatePayment(
  request: FastifyRequest<{
    Params: PaymentId
    Body: UpdatePayment
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payment = await paymentService.updatePayment(
    request.params.paymentId,
    request.body,
    request.transaction,
    request.knexRead
  )
  if (payment) {
    reply.status(201).send(payment)
  } else {
    reply.badRequest('Unable to update payment')
  }
}

export async function createTransferPayment(
  request: FastifyRequest<{
    Body: CreateTransferPayment
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payment = await paymentService.createTransferPayment(
    request.body,
    request.transaction,
    request.knexRead
  )
  if (payment) {
    reply.status(201).send(payment)
  } else {
    reply.badRequest('Unable to create transfer payment')
  }
}

export async function getPaymentById(
  request: FastifyRequest<{
    Params: PaymentId
    Querystring: PaymentQuerystring
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const payment = await paymentService.getPaymentById(
    request.params.paymentId,
    request.query.isAdmin,
    request.knexRead
  )
  if (payment) {
    reply.status(200).send(payment)
  } else {
    reply.notFound()
  }
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
  const payments = await paymentService.getPayments(
    request.query,
    request.transaction,
    request.knexRead
  )
  reply.status(200).send(payments)
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

export async function findTransferByAddress(
  request: FastifyRequest<{
    Querystring: FindTransferByAddress
  }>,
  reply: FastifyReply
) {
  const paymentService = request
    .getContainer()
    .get<PaymentsService>(PaymentsService.name)
  const transfer = await paymentService.findTransferByAddress(
    request.query.destinationAddress
  )
  if (transfer) {
    reply.status(200).send(transfer)
  } else {
    reply.notFound()
  }
}
