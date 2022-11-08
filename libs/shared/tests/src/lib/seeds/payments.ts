import {
  CircleTransferStatus,
  EntityType,
  PaymentStatus,
} from '@algomart/schemas'
import { UserAccountTransferModel } from '@algomart/shared/models'
import { Knex } from 'knex'
import { v4 } from 'uuid'

import {
  paymentCardFactory,
  paymentFactory,
  userAccountTransferFactory,
} from './factories'

export async function createCreditPurchase(
  knex: Knex,
  {
    userId,
    amount,
    paymentStatus = PaymentStatus.Confirmed,
    settled = false,
    transferStatus = CircleTransferStatus.Complete,
  }: {
    userId: string
    amount: string
    paymentStatus?: PaymentStatus
    settled?: boolean
    transferStatus?: CircleTransferStatus
  }
) {
  const paymentCard = paymentCardFactory.build({ ownerId: userId })
  await knex('PaymentCard').insert(paymentCard)

  const payment = paymentFactory.build({
    payerId: userId,
    status: paymentStatus,
    paymentCardId: paymentCard.id,
    updatedAt: settled
      ? new Date('01-01-2022').toISOString()
      : new Date().toISOString(),
    total: amount,
    amount,
    fees: '0',
  })

  await knex('Payment').insert(payment)
  const _transfer = userAccountTransferFactory.build({
    userAccountId: userId,
    amount,
    entityType: EntityType.Payment,
    entityId: payment.id,
  })

  await knex('UserAccountTransfer').insert(_transfer)
  // update runs db trigger
  const transfer: UserAccountTransferModel = await knex('UserAccountTransfer')
    .where({
      id: _transfer.id,
    })
    .update({
      status: transferStatus,
    })
    .returning('*')
    .then((r) => r[0])

  return {
    payment,
    transfer,
  }
}

export async function createPackPurchaseTransfer(
  knex: Knex,
  {
    userId,
    amount,
  }: {
    userId: string
    amount: string
  }
) {
  const _transfer = userAccountTransferFactory.build({
    userAccountId: userId,
    amount,
    entityType: EntityType.Pack,
    entityId: v4(),
  })

  await knex('UserAccountTransfer').insert(_transfer)
  // update runs db trigger
  const transfer = await knex('UserAccountTransfer')
    .where({
      id: _transfer.id,
    })
    .update({
      status: CircleTransferStatus.Complete,
    })
    .returning('*')

  return {
    transfer,
  }
}

export async function createPendingPackPurchaseTransfer(
  knex: Knex,
  {
    userId,
    amount,
  }: {
    userId: string
    amount: string
  }
) {
  const _transfer = userAccountTransferFactory.build({
    userAccountId: userId,
    amount,
    entityType: EntityType.Pack,
    entityId: v4(),
  })

  const transfer = await knex('UserAccountTransfer').insert(_transfer)

  return {
    transfer,
  }
}

export async function createPendingMarketplacePurchaseTransfer(
  knex: Knex,
  {
    userId,
    amount,
  }: {
    userId: string
    amount: string
  }
) {
  const _transfer = userAccountTransferFactory.build({
    userAccountId: userId,
    amount,
    entityType: EntityType.CollectibleListings,
    entityId: v4(),
  })

  const transfer = await knex('UserAccountTransfer').insert(_transfer)

  return {
    transfer,
  }
}

export async function createPendingCreditPayment(
  knex: Knex,
  {
    userId,
    amount,
    createPaymentCard = true,
  }: {
    userId: string
    amount: string
    createPaymentCard?: boolean
  }
) {
  let paymentCard = null
  if (createPaymentCard) {
    paymentCard = paymentCardFactory.build({ ownerId: userId })
    await knex('PaymentCard').insert(paymentCard)
  }
  const payment = paymentFactory.build({
    payerId: userId,
    paymentCardId: createPaymentCard ? paymentCard.id : null,
    status: PaymentStatus.Pending,
    amount,
  })
  await knex('Payment').insert(payment)

  return {
    payment,
    paymentCard,
  }
}

export async function createCreditCard(
  knex: Knex,
  {
    cardId,
    userId,
  }: {
    cardId: string
    userId: string
  }
) {
  const paymentCard = paymentCardFactory.build({ id: cardId, ownerId: userId })
  await knex('PaymentCard').insert(paymentCard)

  return {
    paymentCard,
  }
}
