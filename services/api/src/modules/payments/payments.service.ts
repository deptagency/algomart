import {
  CirclePaymentSourceType,
  CreateCard,
  CreatePayment,
  DEFAULT_CURRENCY,
  EventAction,
  EventEntityType,
  OwnerExternalId,
  PackType,
  PaymentCardStatus,
  PaymentStatus,
  UpdatePaymentCard,
} from '@algomart/schemas'
import { Transaction } from 'objection'

import { Configuration } from '@/configuration'
import CircleAdapter from '@/lib/circle-adapter'
import CoinbaseAdapter from '@/lib/coinbase-adapter'
import { BidModel } from '@/models/bid.model'
import { EventModel } from '@/models/event.model'
import { PaymentModel } from '@/models/payment.model'
import { PaymentCardModel } from '@/models/payment-card.model'
import { UserAccountModel } from '@/models/user-account.model'
import PacksService from '@/modules/packs/packs.service'
import {
  convertToUSD,
  currency,
  isGreaterThanOrEqual,
} from '@/utils/format-currency'
import { invariant, userInvariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

export default class PaymentsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(
    private readonly circle: CircleAdapter,
    private readonly coinbase: CoinbaseAdapter,
    private readonly packs: PacksService
  ) {}

  async getPublicKey() {
    try {
      const publicKey = await this.circle.getPublicKey()
      return publicKey
    } catch {
      return null
    }
  }

  async getCardStatus(cardId: string) {
    let externalId
    // Find card in database
    const foundCard = await PaymentCardModel.query().findById(cardId)

    // If a card was found, use the external ID. Otherwise check by passed in ID.
    if (foundCard) {
      userInvariant(
        foundCard.status !== PaymentCardStatus.Inactive,
        'card is not available',
        404
      )
      externalId = foundCard.externalId
    } else {
      externalId = cardId
    }

    // Retrieve record in Circle API
    const card = await this.circle.getPaymentCardById(externalId)
    userInvariant(card, 'card was not found', 404)

    return {
      status: card.status,
    }
  }

  async getCards(filters: OwnerExternalId) {
    // Find user by external ID
    userInvariant(filters.ownerExternalId, 'owner external ID is required', 400)
    const user = await UserAccountModel.query()
      .where('externalId', '=', filters.ownerExternalId)
      .first()
    userInvariant(user, 'no user found', 404)

    // Find cards in the database
    const cards = await PaymentCardModel.query()
      .where({ ownerId: user.id })
      .andWhereNot('status', PaymentCardStatus.Inactive)
    return cards
  }

  async createCard(cardDetails: CreateCard, trx?: Transaction) {
    const user = await UserAccountModel.query(trx)
      .where('externalId', cardDetails.ownerExternalId)
      .first()
    userInvariant(user, 'no user found', 404)

    // Create card using Circle API
    const card = await this.circle.createPaymentCard({
      idempotencyKey: cardDetails.idempotencyKey,
      keyId: cardDetails.keyId,
      encryptedData: cardDetails.encryptedData,
      billingDetails: cardDetails.billingDetails,
      expMonth: cardDetails.expirationMonth,
      expYear: cardDetails.expirationYear,
      metadata: cardDetails.metadata,
    })

    if (!card) {
      return null
    }

    // Create new card in database
    if (cardDetails.saveCard && card) {
      // If default was selected, find any cards marked already as the default and mark false
      if (cardDetails.default === true) {
        await PaymentCardModel.query(trx)
          .where({ ownerId: user.id })
          .andWhere('default', true)
          .patch({
            default: false,
          })
      }
      // Circle may return the same card ID if there's duplicate info
      const newCard = await PaymentCardModel.query(trx)
        .insert({
          ...card,
          ownerId: user.id,
          default: cardDetails.default || false,
        })
        .onConflict('externalId')
        .ignore()
      if (!newCard) {
        return null
      }
      // Create events for card creation
      await EventModel.query(trx).insert({
        action: EventAction.Create,
        entityType: EventEntityType.PaymentCard,
        entityId: newCard.id,
        userAccountId: user.id,
      })

      // If the card was saved, return the card record from the database
      return newCard
    }

    // If card was not saved, return the identifier
    return { externalId: card.externalId, status: card.status }
  }

  async updateCard(
    cardId: string,
    cardDetails: UpdatePaymentCard,
    trx?: Transaction
  ) {
    // Find user
    const user = await UserAccountModel.query(trx)
      .where('externalId', cardDetails.ownerExternalId)
      .first()
    userInvariant(user, 'no user found', 404)

    // Confirm card exists
    const card = await PaymentCardModel.query(trx).findById(cardId)
    userInvariant(card, 'card was not found', 404)

    if (cardDetails.default === true) {
      // Find any cards marked as the default and mark false
      await PaymentCardModel.query(trx)
        .where({ ownerId: user.id })
        .andWhere('default', true)
        .patch({
          default: false,
        })
    }

    // Update card as new default
    await PaymentCardModel.query(trx)
      .findById(cardId)
      .patch({ default: cardDetails.default })

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityType: EventEntityType.PaymentCard,
      entityId: cardId,
    })
  }

  async createPayment(paymentDetails: CreatePayment, trx?: Transaction) {
    // Find random pack to award post-payment
    const randomPack = await this.packs.randomPackByTemplateId(
      paymentDetails.packTemplateId,
      trx
    )
    userInvariant(randomPack?.id, 'no pack found', 404)

    // Check price is available
    const bid = randomPack.activeBidId
      ? await BidModel.query(trx)
          .select('amount')
          .findById(randomPack.activeBidId)
      : null

    const price =
      randomPack.type === PackType.Auction ? bid?.amount : randomPack.price
    userInvariant(price, 'pack must have a price')

    if (randomPack.type === PackType.Auction) {
      userInvariant(
        bid && isGreaterThanOrEqual(bid.amount, randomPack.price),
        'active bid must be higher than the price of the item'
      )
    }

    // Retrieve exchange rates for app currency and USD
    const exchangeRates = await this.coinbase.getExchangeRates({
      currency: currency.code,
    })
    invariant(exchangeRates, 'unable to find exchange rates')

    // Convert price to USD for payment
    const amount = convertToUSD(price, exchangeRates.rates)
    invariant(amount !== null, 'unable to convert to currency')

    const user = await UserAccountModel.query(trx)
      .where('externalId', paymentDetails.payerExternalId)
      .first()

    userInvariant(user, 'user not found', 404)

    // Claim pack ASAP to ensure it's not claimed by someone else during this flow.
    // We'll later clear this out if the payment fails.
    await this.packs.claimPack(
      {
        packId: randomPack.id,
        claimedById: user.id,
        claimedAt: new Date().toISOString(),
      },
      trx
    )

    // If encrypted details are provided, add to request
    const encryptedDetails = {}
    const {
      keyId,
      encryptedData,
      cardId,
      idempotencyKey,
      metadata,
      verification,
      description,
    } = paymentDetails
    if (keyId) {
      Object.assign(encryptedDetails, { keyId })
    }

    if (encryptedData) {
      Object.assign(encryptedDetails, { encryptedData })
    }

    // Attempt to find card (cardId could be source or db ID)
    const card = await PaymentCardModel.query(trx).findById(cardId)

    // Create payment using Circle API
    const payment = await this.circle.createPayment({
      idempotencyKey: idempotencyKey,
      metadata: metadata,
      amount: {
        amount,
        currency: DEFAULT_CURRENCY,
      },
      verification: verification,
      description: description,
      source: {
        id: card?.externalId || cardId,
        type: CirclePaymentSourceType.card, // @TODO: Update when support ACH
      },
      ...encryptedDetails,
    })

    // If payment doesn't go through:
    if (!payment) {
      // Remove claim from payment if payment doesn't go through
      await this.packs.claimPack(
        {
          packId: randomPack.id,
          claimedById: null,
          claimedAt: null,
        },
        trx
      )
      return null
    }

    // Create new payment in database
    // Circle may return the same payment ID if there's duplicate info
    const newPayment = await PaymentModel.query(trx)
      .insert({
        ...payment,
        payerId: user.id,
        packId: randomPack.id,
        paymentCardId: card?.id,
      })
      .onConflict('externalId')
      .ignore()

    // Create event for payment creation
    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityType: EventEntityType.Payment,
      entityId: newPayment.id,
      userAccountId: user.id,
    })

    return newPayment
  }

  async getPaymentById(paymentId: string) {
    const payment = await PaymentModel.query().findById(paymentId)
    userInvariant(payment, 'payment not found', 404)
    return payment
  }

  async removeCardById(cardId: string, trx?: Transaction) {
    // Confirm card exists
    const card = await PaymentCardModel.query(trx).findById(cardId)
    userInvariant(card, 'card was not found', 404)

    // Remove card
    await PaymentCardModel.query(trx)
      .findById(cardId)
      .patch({ status: PaymentCardStatus.Inactive })

    await EventModel.query(trx).insert({
      action: EventAction.Delete,
      entityType: EventEntityType.PaymentCard,
      entityId: cardId,
    })
  }

  async updatePaymentStatuses(trx?: Transaction) {
    const pendingPayments = await PaymentModel.query(trx)
      // Pending and Confirmed are non-final statuses
      .whereIn('status', [PaymentStatus.Pending, PaymentStatus.Confirmed])
      .limit(10)

    if (pendingPayments.length === 0) return 0
    let updatedPayments = 0

    await Promise.all(
      pendingPayments.map(async (payment) => {
        const circlePayment = await this.circle.getPaymentById(
          payment.externalId
        )
        invariant(
          circlePayment,
          `external payment ${payment.externalId} not found`
        )

        if (payment.status !== circlePayment.status) {
          await PaymentModel.query(trx).patchAndFetchById(payment.id, {
            status: circlePayment.status,
          })
          updatedPayments++
        }
      })
    )

    return updatedPayments
  }

  async updatePaymentCardStatuses(trx?: Transaction) {
    const pendingPaymentCards = await PaymentCardModel.query(trx)
      .where('status', PaymentCardStatus.Pending)
      .limit(10)

    if (pendingPaymentCards.length === 0) return 0
    let updatedPaymentCards = 0

    await Promise.all(
      pendingPaymentCards.map(async (paymentCard) => {
        const circlePaymentCard = await this.circle.getPaymentCardById(
          paymentCard.externalId
        )
        invariant(
          circlePaymentCard,
          `external payment card ${paymentCard.externalId} not found`
        )

        if (paymentCard.status !== circlePaymentCard.status) {
          await PaymentCardModel.query(trx).patchAndFetchById(paymentCard.id, {
            status: circlePaymentCard.status,
          })
          updatedPaymentCards++
        }
      })
    )

    return updatedPaymentCards
  }

  async getCurrency() {
    return Configuration.currency
  }
}
