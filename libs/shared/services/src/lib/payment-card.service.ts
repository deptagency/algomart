import {
  CircleCard,
  CircleCardStatus,
  CircleCreateCard,
  CircleVerificationCvvStatus,
  CreateCard,
  PaymentCardStatus,
  UpdatePaymentCard,
  UserAccount,
} from '@algomart/schemas'
import { CircleAdapter } from '@algomart/shared/adapters'
import { PaymentCardModel } from '@algomart/shared/models'
import {
  PaymentCardData,
  SubmitPaymentCardQueue,
  UpdatePaymentCardStatusQueue,
} from '@algomart/shared/queues'
import { invariant, userInvariant } from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import { enc, SHA256 } from 'crypto-js'
import { Model } from 'objection'
import { v4 as uuid } from 'uuid'

export class PaymentCardService {
  constructor(
    private readonly circle: CircleAdapter,
    private readonly submitPaymentCardQueue: SubmitPaymentCardQueue,
    private readonly updatePaymentCardStatusQueue: UpdatePaymentCardStatusQueue
  ) {}

  async savePaymentCard(
    user: UserAccount,
    payload: CreateCard,
    ipAddress: string
  ) {
    const trx = await Model.startTransaction()

    try {
      // If default was selected, find any cards marked already as the default and mark false
      if (payload.default === true) {
        await PaymentCardModel.query(trx)
          .where({ ownerId: user.id })
          .andWhere('default', true)
          .patch({
            default: false,
          })
      }

      const storedPayload: CircleCreateCard = {
        billingDetails: payload.billingDetails,
        expMonth: payload.expirationMonth,
        expYear: payload.expirationYear,
        encryptedData: payload.encryptedData,
        keyId: payload.keyId,
        metadata: {
          email: user.email,
          ipAddress,
          sessionId: SHA256(user.id).toString(enc.Base64),
        },
        idempotencyKey: uuid(),
      }

      const newCard = await PaymentCardModel.query(trx)
        .insert({
          ownerId: user.id,
          default: payload.default || false,
          isSaved: payload.saveCard,
          status: PaymentCardStatus.Pending,
          idempotencyKey: storedPayload.idempotencyKey,
          payload: storedPayload,
          countryCode: payload.billingDetails.country,
          // The remaining fields will be set once we get an update from Circle
          error: null,
          expirationMonth: null,
          expirationYear: null,
          externalId: null,
          network: null,
          lastFour: null,
        })
        .returning('*')

      await trx.commit()

      await this.submitPaymentCardQueue.enqueue({
        idempotencyKey: storedPayload.idempotencyKey,
        cardId: newCard.id,
      })

      return newCard
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async updatePaymentCard(
    user: UserAccount,
    cardId: string,
    cardDetails: UpdatePaymentCard
  ) {
    // Confirm card exists
    const card = await PaymentCardModel.query().findById(cardId).where({
      ownerId: user.id,
    })
    userInvariant(card, 'card was not found', 404)

    const trx = await Model.startTransaction()
    try {
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
        .where({ id: cardId, ownerId: user.id })
        .patch({ default: cardDetails.default })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async removePaymentCard(user: UserAccount, cardId: string) {
    // Confirm card exists
    const card = await PaymentCardModel.query()
      .findById(cardId)
      .where('ownerId', user.id)
    userInvariant(card, 'card was not found', 404)

    const trx = await Model.startTransaction()
    try {
      // Remove card
      await PaymentCardModel.query(trx)
        .findById(cardId)
        .patch({ status: PaymentCardStatus.Inactive, isSaved: false })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async getCardStatus(user: UserAccount, cardId: string) {
    const card = await PaymentCardModel.query()
      .findById(cardId)
      .where('ownerId', user.id)
    userInvariant(
      card && card.status !== PaymentCardStatus.Inactive,
      'card not found',
      404
    )
    return { status: card.status }
  }

  async getActivePaymentCards(userId: string) {
    // Find cards in the database
    const cards = await PaymentCardModel.query().where({
      ownerId: userId,
      isSaved: true,
      status: PaymentCardStatus.Complete,
    })

    return cards
  }

  async submitPaymentCardToCircle({ cardId, idempotencyKey }: PaymentCardData) {
    try {
      const card = await PaymentCardModel.query().where('id', cardId).first()

      const result = await this.circle.createPaymentCard({
        idempotencyKey: idempotencyKey ?? card.idempotencyKey,
        keyId: card.payload.keyId,
        encryptedData: card.payload.encryptedData,
        billingDetails: card.payload.billingDetails,
        expMonth: card.payload.expMonth,
        expYear: card.payload.expYear,
        metadata: card.payload.metadata,
      })

      // If response is null, the card was not created in Circle
      // Don't think we need to hold onto this failure as it
      // is mostly a card detail that was wrong and retrying
      // the job will fail again. Unless we want to capture
      // the specific error to the user but right now the
      // error details can also hold none user friendly errors.
      if (result === null) {
        await PaymentCardModel.query().deleteById(cardId)
      }
      invariant(result, `Unable to create payment card`, UnrecoverableError)

      await PaymentCardModel.query().findById(cardId).patch({
        error: result.error,
        expirationMonth: result.expirationMonth,
        expirationYear: result.expirationYear,
        externalId: result.externalId,
        lastFour: result.lastFour,
        network: result.network,
        status: result.status,
      })

      return result
    } catch (error) {
      await PaymentCardModel.query().findById(cardId).patch({
        errorDetails: error.message,
        status: PaymentCardStatus.Failed,
      })
      throw error
    }
  }

  async startUpdatePaymentCardStatus(card: CircleCard) {
    await this.updatePaymentCardStatusQueue.enqueue({ card })
  }

  async updatePaymentCardFromWebhook(circleCard: CircleCard) {
    const validVerificationForCVV: CircleCard['verification']['cvv'][] = [
      // CVV verification passed
      CircleVerificationCvvStatus.Pass,
      // In case the card issuer does not support CVV verification
      CircleVerificationCvvStatus.Unavailable,

      // Other CVV verification statuses are not allowed or applicable
    ]

    // Ensure card information (e.g. billing details) was valid and allowed to be used
    // If this is not needed, then only check the card.status is 'complete' and ignore the rest
    const isCardValid =
      circleCard.status === CircleCardStatus.Complete &&
      validVerificationForCVV.includes(circleCard.verification.cvv) &&
      (!circleCard.riskEvaluation ||
        circleCard.riskEvaluation.decision === 'approved')

    // While we _could_ delete the card if Circle says it's invalid,
    // that would cause issues in the front-end while requesting status updates.
    // So for now, we only update the card.
    const affectedRows = await PaymentCardModel.query()
      .where({
        externalId: circleCard.id,
      })
      .patch({
        expirationYear: String(circleCard.expYear),
        expirationMonth: String(circleCard.expMonth).padStart(2, '0'),
        lastFour: circleCard.last4,
        countryCode: circleCard.billingDetails.country,
        status: isCardValid
          ? PaymentCardStatus.Complete
          : PaymentCardStatus.Failed,
        error: circleCard.errorCode,
        network: circleCard.network,
        payload: null,
        idempotencyKey: null,
        // if the card is not valid, make sure it's not saved
        ...(isCardValid ? {} : { isSaved: false, default: false }),
      })

    return affectedRows === 1
  }
}
