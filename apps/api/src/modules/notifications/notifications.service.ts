import {
  CreateNotification,
  Email,
  EventAction,
  EventEntityType,
  NotificationStatus,
  NotificationType,
} from '@algomart/schemas'
import { EventModel, NotificationModel } from '@algomart/shared/models'
import { invariant } from '@algomart/shared/utils'
import { Configuration } from '@api/configuration'
import { logger } from '@api/configuration/logger'
import I18nAdapter from '@api/lib/i18n-adapter'
import MailerAdapter from '@api/lib/mailer-adapter'
import { ResponseError } from '@sendgrid/mail'
import { TFunction } from 'i18next'
import { Transaction } from 'objection'

const isResponseError = (error: unknown): error is ResponseError => {
  return typeof (error as ResponseError).response?.body === 'string'
}

/** Freak out if the notification is missing any variables.
 *
 * NOTES
 * - This does NOT prevent the email notification from being sent.
 * - We don't use types because variables are pulled from the notifications table.
 * - We don't use an invariant here anymore because it will throw an error causing the
 *   email to be sent without updating the "pending" status of the notifaction,
 *   this causes the email to be resent over and over again.
 * - For now this is good enough since sending a poorly interpolated email is preferable
 *   to not sending one at all.
 */
const expectVariables = (variables, variableNames: string[]) => {
  // Use warn & trace because it's easier to read the error message.
  if (!variables) {
    logger.warn('No variables were provided for this notification.')
    console.trace('No variables were provided for this notification.')
  }
  for (const key of variableNames) {
    if (variables[key] === undefined) {
      logger.warn(`Variable '${key}' is required for this email template.`)
      console.trace(`Variable '${key}' is required for this email template.`)
    }
  }
}

export default class NotificationsService {
  logger = logger.child({ context: this.constructor.name })
  dispatchStore: {
    [key in NotificationType]: (n: NotificationModel, t: TFunction) => Email
  } = {
    [NotificationType.AuctionComplete]:
      this.getAuctionCompleteNotification.bind(this),
    [NotificationType.PackRevoked]: this.getPackRevokedNotification.bind(this),
    [NotificationType.PaymentFailed]:
      this.getPaymentFailedNotification.bind(this),
    [NotificationType.BidExpired]: this.getBidExpiredNotification.bind(this),
    [NotificationType.PaymentSuccess]:
      this.getPaymentSuccessNotification.bind(this),
    [NotificationType.TransferSuccess]:
      this.getTransferSuccessNotification.bind(this),
    [NotificationType.UserHighBid]: this.getUserHighBidNotification.bind(this),
    [NotificationType.UserOutbid]: this.getUserOutbidNotification.bind(this),
    [NotificationType.WireInstructions]:
      this.getWireInstructionsNotification.bind(this),
    // Customer Service Notifications
    [NotificationType.CSWirePaymentFailed]:
      this.getCSWirePaymentFailedNotification.bind(this),
    [NotificationType.CSWirePaymentSuccess]:
      this.getCSWirePaymentSuccessNotification.bind(this),
    [NotificationType.CSAwaitingWirePayment]:
      this.getCSAwaitingWirePaymentNotification.bind(this),
  }

  constructor(
    private readonly mailer: MailerAdapter,
    private readonly i18n: I18nAdapter
  ) {}

  async createNotification(
    notification: CreateNotification,
    trx?: Transaction
  ) {
    const n = await NotificationModel.query(trx).insert({
      ...notification,
      status: NotificationStatus.Pending,
    })

    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityType: EventEntityType.Notification,
      entityId: n.id,
    })
  }

  async dispatchNotifications(trx?: Transaction) {
    // Get pending notifications
    const pendingNotifications = await NotificationModel.query(trx)
      .where('status', NotificationStatus.Pending)
      .withGraphJoined('userAccount')

    // Dispatch pending notifications
    let successfullyDispatchedNotifications = 0
    await Promise.all(
      pendingNotifications.map(async (notification) => {
        // Note: For customer service notifications this is not the recipient
        // but the customer who the notification pertains to.
        invariant(
          notification?.userAccount?.email,
          `Notification "${notification.id}" has no associated user account`
        )

        const {
          type,
          id,
          userAccountId,
          userAccount: { locale },
        } = notification
        // Get user's locale
        const t = this.i18n.getFixedT(locale, 'emails')

        // Attempt to send notification
        try {
          const message = this.dispatchStore[type](notification, t)
          await this.sendNotification(id, userAccountId, message, trx)
          successfullyDispatchedNotifications++
          this.logger.info('done processing notification %s', id)
        } catch (error) {
          this.logger.error(error as Error)
          throw error
        }
      })
    )
    this.logger.info(
      'dispatched %d pending notifications',
      successfullyDispatchedNotifications
    )
  }

  getAuctionCompleteNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['amount', 'canExpire', 'packSlug', 'packTitle'])

    // Build notification
    const body = (
      t('auctionComplete.body', {
        returnObjects: true,
        ctaUrl: `${Configuration.webUrl}checkout/${variables.packSlug}`,
        ...variables,
      }) as string[]
    ).reduce((body: string, p: string) => body + `<p>${p}</p>`, '')

    const html = variables.canExpire
      ? body + `<p>${t('auctionComplete.expirationWarning')}</p>`
      : body

    return {
      to: userAccount?.email as string,
      subject: t('auctionComplete.subject'),
      html,
    }
  }

  getBidExpiredNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle'])

    return {
      to: userAccount?.email as string,
      subject: t('bidExpired.subject', { ...variables }),
      html: t<string[]>('bidExpired.body', {
        returnObjects: true,
        ...variables,
      }).reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
  }

  getPaymentSuccessNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle'])

    const html = t<string[]>('paymentSuccess.body', {
      returnObjects: true,
      transferUrl: `${Configuration.webUrl}`,
      ...variables,
    })

    return {
      to: userAccount?.email as string,
      subject: t('paymentSuccess.subject'),
      html: html.reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
  }

  getTransferSuccessNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle'])

    const html = t<string[]>('transferSuccess.body', {
      returnObjects: true,
      ctaUrl: `${Configuration.webUrl}my/collectibles`,
      ...variables,
    })

    return {
      to: userAccount?.email as string,
      subject: t('transferSuccess.subject'),
      html: html.reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
  }

  getUserHighBidNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle', 'packSlug'])

    return {
      to: userAccount?.email as string,
      subject: t('userHighBid.subject'),
      html: (
        t('userHighBid.body', {
          returnObjects: true,
          ctaUrl: `${Configuration.webUrl}releases/${variables.packSlug}`,
          ...variables,
        }) as string[]
      ).reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
  }

  getUserOutbidNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle', 'packSlug'])

    return {
      to: userAccount?.email as string,
      subject: t('userOutbid.subject'),
      html: (
        t('userOutbid.body', {
          returnObjects: true,
          ctaUrl: `${Configuration.webUrl}releases/${variables.packSlug}`,
          ...variables,
        }) as string[]
      ).reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
  }

  getWireInstructionsNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, [
      'packTitle',
      'packSlug',
      'amount',
      'beneficiaryName',
      'beneficiaryAddress1',
      'beneficiaryAddress2',
      'beneficiaryBankName',
      'beneficiaryBankSwiftCode',
      'beneficiaryBankRoutingNumber',
      'beneficiaryBankAccountingNumber',
      'beneficiaryBankAddress',
      'beneficiaryBankCity',
      'beneficiaryBankPostalCode',
      'beneficiaryBankCountry',
      'trackingRef',
    ])

    // Build notification
    const body = (
      t('wireTransfer.body', {
        returnObjects: true,
        ctaUrl: `${Configuration.webUrl}checkout/${variables.packSlug}`,
        ...variables,
      }) as string[]
    ).reduce((body: string, p: string) => body + `<p>${p}</p>`, '')

    const html = variables.canExpire
      ? body + `<p>${t('wireTransfer.expirationWarning')}</p>`
      : body

    return {
      to: userAccount?.email as string,
      subject: t('wireTransfer.subject'),
      html,
    }
  }

  getPaymentFailedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle'])
    return {
      to: userAccount?.email,
      subject: t('paymentFailed.subject'),
      html: t('paymentFailed.body', variables),
    }
  }

  getPackRevokedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle'])
    return {
      to: userAccount?.email,
      subject: t('packRevoked.subject'),
      html: t('packRevoked.body', variables),
    }
  }

  // Automated Emails to Customer Service

  getCSWirePaymentFailedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle', 'paymentId', 'amount'])
    const fields = {
      ...variables,
      userEmail: userAccount?.email,
      ctaUrl: `${Configuration.webUrl}login?redirect=/admin/transactions/${variables.paymentId}`,
    }
    return {
      to: Configuration.customerServiceEmail,
      subject: t('csWirePaymentFailed.subject', fields),
      html: t('csWirePaymentFailed.body', fields),
    }
  }

  getCSWirePaymentSuccessNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle', 'paymentId', 'amount'])
    const fields = {
      ...variables,
      userEmail: userAccount?.email,
      ctaUrl: `${Configuration.webUrl}login?redirect=/admin/transactions/${variables.paymentId}`,
    }
    return {
      to: Configuration.customerServiceEmail,
      subject: t('csWirePaymentSuccess.subject', fields),
      html: t('csWirePaymentSuccess.body', fields),
    }
  }

  getCSAwaitingWirePaymentNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle', 'paymentId', 'amount'])
    const fields = {
      ...variables,
      userEmail: userAccount?.email,
      ctaUrl: `${Configuration.webUrl}login?redirect=/admin/transactions/${variables.paymentId}`,
    }
    return {
      to: Configuration.customerServiceEmail,
      subject: t('csAwaitingWirePayment.subject', fields),
      html: t('csAwaitingWirePayment.body', fields),
    }
  }

  async sendNotification(
    notificationId: string,
    userAccountId: string,
    message: Email,
    trx?: Transaction
  ) {
    // Send notification
    let errorMessage: string | undefined
    try {
      await this.mailer.sendEmail({ ...message })
    } catch (error) {
      this.logger.error(error)
      if (isResponseError(error)) {
        errorMessage = error.response.body
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else {
        errorMessage = `Unknown error when sending notification ${notificationId}`
      }
    }

    // Update notification with with status (and error if applicable)
    await NotificationModel.query(trx)
      .where('id', notificationId)
      .patch({
        error: errorMessage ?? null,
        status: errorMessage
          ? NotificationStatus.Failed
          : NotificationStatus.Complete,
      })

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityType: EventEntityType.Notification,
      entityId: notificationId,
      userAccountId,
    })
  }
}
