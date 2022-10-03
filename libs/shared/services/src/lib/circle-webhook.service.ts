import {
  CircleCard,
  CirclePaymentResponse,
  CirclePayout,
  CircleReturn,
  CircleSettlement,
  CircleTransfer,
  CircleWireBankAccount,
  CreateCircleWebhook,
  WebhookStatus,
} from '@algomart/schemas'
import {
  CircleAdapter,
  isUsdcCreditPurchaseFromAlgoWallet,
} from '@algomart/shared/adapters'
import { WebhookModel } from '@algomart/shared/models'
import { invariant, userInvariant } from '@algomart/shared/utils'
import axios from 'axios'
import { Logger } from 'pino'
import MessageValidator from 'sns-validator'

import { PaymentsService } from './payments/payments.service'
import { PayoutService } from './payout/payout.service'
import { UserAccountTransfersService } from './user-account-transfers/user-account-transfers.service'
import { WiresService } from './wires/wires.service'
import { PaymentCardService } from './payment-card.service'

const CircleWebhookId = 'circle'
const messageValidator = new MessageValidator()
const CircleARN =
  /^arn:aws:sns:.*:908968368384:(sandbox|prod)_platform-notifications-topic$/

async function validateAsync(
  body: string | Record<string, unknown>
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    messageValidator.validate(body, (error, message) => {
      if (error) reject(error)
      else resolve(message)
    })
  })
}

export class CircleWebhookService {
  constructor(
    private readonly circle: CircleAdapter,
    private readonly cards: PaymentCardService,
    private readonly payments: PaymentsService,
    private readonly transfers: UserAccountTransfersService,
    private readonly wires: WiresService,
    private readonly payouts: PayoutService,
    private readonly logger: Logger
  ) {}

  async createSubscription({ endpoint }: CreateCircleWebhook) {
    try {
      // Create it first to "reserve" the ID
      await WebhookModel.query().insert({
        id: CircleWebhookId,
        endpoint,
        status: WebhookStatus.pending,
      })

      const result = await this.circle.createNotificationSubscription(endpoint)
      if (!result) {
        await WebhookModel.query().deleteById(CircleWebhookId)
        throw new Error('Error creating Circle notification subscription')
      }

      const webhook = await WebhookModel.query()
        .findById(CircleWebhookId)
        .patch({
          externalId: result.id,
        })
        .returning('*')
        .first()

      return webhook
    } catch (error) {
      this.logger.error(error)
      return null
    }
  }

  async getSubscription() {
    const webhook = await WebhookModel.query().findById(CircleWebhookId)
    userInvariant(webhook, 'No Circle webhook configured')
    const result = await this.circle.getNotificationSubscriptions()
    const subscription = result.find((x) => x.id === webhook.externalId)
    return { webhook, subscription }
  }

  async deleteSubscription() {
    const webhook = await WebhookModel.query().findById(CircleWebhookId)
    userInvariant(webhook, 'No Circle webhook configured')
    const result = await this.circle.deleteNotificationSubscription(
      webhook.externalId
    )
    userInvariant(result, 'Error deleting Circle notification subscription')
    await WebhookModel.query().deleteById(CircleWebhookId)
  }

  async processWebhook(body: string | Record<string, unknown>) {
    // Note: validating the message will download the referenced certificates and
    //       ensure the message has been correctly signed
    const snsMessage = await validateAsync(body)
    this.logger.info('Received SNS Message', { snsMessage })

    switch (snsMessage.Type) {
      case 'SubscriptionConfirmation':
        await this.handleSubscriptionConfirmation(snsMessage)
        break

      case 'Notification':
        await this.handleNotification(snsMessage)
        break

      default:
        invariant(`Unknown SNS message type ${snsMessage.Type}`)
    }
  }

  /**
   * Handles a Circle SubscriptionConfirmation
   *
   * @param snsMessage SNS message containing the Circle subscription confirmation
   */
  private async handleSubscriptionConfirmation(
    snsMessage: Record<string, unknown>
  ) {
    const SubscribeURL = snsMessage.SubscribeURL as string
    const TopicArn = snsMessage.TopicArn as string
    invariant(typeof SubscribeURL === 'string', 'SubscribeURL is not a string')
    invariant(typeof TopicArn === 'string', 'TopicArn is not a string')
    invariant(CircleARN.test(TopicArn), 'Invalid TopicArn')

    const response = await axios.get(SubscribeURL)
    invariant(response.status === 200, 'Error confirming subscription')

    await WebhookModel.query().findById(CircleWebhookId).patch({
      status: WebhookStatus.active,
      configurationPayload: snsMessage,
    })
  }

  /**
   * Handles a Circle Notification
   *
   * Generally speaking, this function just queues a bull-mq job and then returns.
   * This way, we get finer control over retries/concurrency/etc.
   *
   * Note: Circle does retry notifications as well. If we return a non 2XX status
   * response, or circle is unable to receive the response, it will retry the notification
   * using an initial delay of 10s and an exponential back-off up to 50 times.
   *
   * Practically speaking we should rarely expect any circle retries unless theres an
   * issue queuing a job or some network issue preventing them from receiving our response
   *
   * @see https://developers.circle.com/docs/notifications-data-models
   * @param snsMessage SNS message containing the Circle notification
   */
  private async handleNotification(snsMessage: Record<string, unknown>) {
    const data = JSON.parse(snsMessage.Message as string)

    const handlers: Record<
      string,
      (data: Record<string, unknown>) => Promise<void>
    > = {
      cards: this.handleCardNotification.bind(this),
      payments: this.handlePaymentNotification.bind(this),
      chargebacks: this.handleChargebackNotification.bind(this),
      settlements: this.handleSettlementNotification.bind(this),
      payouts: this.handlePayoutNotification.bind(this),
      returns: this.handleReturnNotification.bind(this),
      ach: this.handleACHNotification.bind(this),
      wire: this.handleWireNotification.bind(this),
      transfers: this.handleTransferNotification.bind(this),
    }

    const handler = handlers[data.notificationType]
    invariant(handler, `Unknown notification type ${data.notificationType}`)
    await handler(data)
  }

  /**
   * Queues an update-payment-card-status bull-mq job using the provided data.
   *
   * @see https://developers.circle.com/docs/verifying-card-details
   * @param notification Circle notification with card data
   */
  private async handleCardNotification(notification: Record<string, unknown>) {
    const card = notification.card as CircleCard
    this.logger.debug({ card }, 'Received Circle card notification')
    await this.cards.startUpdatePaymentCardStatus(card)
  }

  /**
   * Queues an update-payment-card-status bull-mq job using the provided data.
   *
   * @param notification Circle notification with payment data
   */
  private async handlePaymentNotification(
    notification: Record<string, unknown>
  ) {
    const payment = notification.payment as CirclePaymentResponse
    this.logger.debug({ payment }, 'Received Circle payment notification')
    await this.payments.startUpdateCcPaymentStatus(payment)
  }

  private async handleChargebackNotification(
    notification: Record<string, unknown>
  ) {
    // Currently just logs a notification.
    // Implement any additional chargeback handling logic here

    this.logger.debug(
      {
        chargeback: notification,
      },
      'Received Circle Chargeback Notification'
    )
  }

  /**
   * Queues an update-settled-payment bull-mq job using the provided data
   *
   * @param notification Circle notification with settlement data
   */
  private async handleSettlementNotification(
    notification: Record<string, unknown>
  ) {
    const settlement = notification.settlement as CircleSettlement
    this.logger.debug({ settlement }, 'Received settlement notification')
    await this.payments.startUpdateSettledPayment(settlement.id)

    // Currently just logs a notification.
    // Implement any additional settlement handling logic here
  }

  private async handleTransferNotification(
    notification: Record<string, unknown>
  ) {
    const transfer = notification.transfer as CircleTransfer
    this.logger.debug(
      {
        transfer,
      },
      'Received Circle Transfer Notification'
    )

    isUsdcCreditPurchaseFromAlgoWallet(transfer)
      ? // USDC credit purchase
        await this.payments.startUpdateUsdcPaymentStatus({ transfer })
      : // All other transfers
        await this.transfers.startUpdateTransferStatus({ transfer })
  }

  private async handlePayoutNotification(
    notification: Record<string, unknown>
  ) {
    const payout = notification.payout as CirclePayout
    this.logger.debug(
      {
        payout: notification.payout,
      },
      'Received Circle Payout Notification'
    )
    await this.payouts.startUpdateWirePayoutStatus(payout)
  }

  private async handleReturnNotification(
    notification: Record<string, unknown>
  ) {
    const circleReturn = notification.return as CircleReturn
    this.logger.debug(
      {
        return: notification.return,
      },
      'Received Circle Return Notification'
    )
    await this.payouts.startReturnWirePayout(circleReturn)
  }

  private async handleACHNotification(notification: Record<string, unknown>) {
    // Currently just logs a notification.
    // Implement any additional automated clearing house logic here

    this.logger.debug(
      {
        ach: notification.ach,
      },
      'Received Circle ACH Notification'
    )
  }

  /**
   * Queues an update-wire-bank-account-status bull-mq job using the provided data.
   * Note: kind of confusing that they call this a wire notification because it's really
   * a status update for a wire *bank account* (not the wire itself)
   * @param notification Circle notification with wire data
   */
  private async handleWireNotification(notification: Record<string, unknown>) {
    // Currently just logs a notification.
    // Implement any additional wire handling logic here

    this.logger.debug(
      {
        wire: notification.wire,
      },
      'Received Circle Wire Notification'
    )
    const circleWireBankAccount = notification.wire as CircleWireBankAccount
    this.logger.debug({ circleWireBankAccount }, 'Received wire notification')
    await this.wires.startUpdateWireBankAccountStatus(circleWireBankAccount)
  }
}
