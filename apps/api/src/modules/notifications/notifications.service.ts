import {
  CreateNotification,
  Email,
  EventAction,
  EventEntityType,
  NotificationStatus,
  NotificationType,
} from '@algomart/schemas'
import { ResponseError } from '@sendgrid/mail'
import { TFunction } from 'i18next'
import { Transaction } from 'objection'

import { Configuration } from '@/configuration'
import I18nAdapter from '@/lib/i18n-adapter'
import MailerAdapter from '@/lib/mailer-adapter'
import { EventModel } from '@/models/event.model'
import { NotificationModel } from '@/models/notification.model'
import { invariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

const isResponseError = (error: unknown): error is ResponseError => {
  return typeof (error as ResponseError).response?.body === 'string'
}

const requireVariables = (variables, variableNames: string[]) => {
  invariant(variables, 'no variables were provided for this notification')
  for (const key of variableNames) {
    invariant(variables[key] !== undefined, `variable '${key}' is required`)
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
    requireVariables(variables, [
      'amount',
      'canExpire',
      'packSlug',
      'packTitle',
    ])

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
    requireVariables(variables, ['packTitle'])

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
    requireVariables(variables, ['packTitle'])

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
    requireVariables(variables, ['packTitle'])

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
    requireVariables(variables, ['packTitle', 'packSlug'])

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
    requireVariables(variables, ['packTitle', 'packSlug'])

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
    requireVariables(variables, [
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
    requireVariables(variables, ['packTitle'])
    return {
      to: userAccount?.email,
      subject: t('paymentFailed.subject'),
      html: t('paymentFailed.body', variables),
    }
  }

  getPackRevokedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    requireVariables(variables, ['packTitle'])
    return {
      to: userAccount?.email,
      subject: t('packRevoked.subject'),
      html: t('packRevoked.body', variables),
    }
  }

  // Automated Emails to Customer Service

  getCSWirePaymentFailedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    const variables_ = { ...variables, userEmail: userAccount?.email }
    requireVariables(variables_, ['packTitle', 'userEmail', 'amount'])
    return {
      to: Configuration.customerServiceEmail,
      subject: t('csWirePaymentFailed.subject', variables_),
      html: t('csWirePaymentFailed.body', variables_),
    }
  }

  getCSWirePaymentSuccessNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    const variables_ = { ...variables, userEmail: userAccount?.email }
    requireVariables(variables_, ['packTitle', 'userEmail', 'amount'])
    return {
      to: Configuration.customerServiceEmail,
      subject: t('csWirePaymentSuccess.subject', variables_),
      html: t('csWirePaymentSuccess.body', variables_),
    }
  }

  getCSAwaitingWirePaymentNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    const variables_ = {
      ...variables,
      userEmail: userAccount?.email,
    }
    requireVariables(variables_, ['packTitle', 'userEmail', 'amount'])
    return {
      to: Configuration.customerServiceEmail,
      subject: t('csAwaitingWirePayment.subject', variables_),
      html: t('csAwaitingWirePayment.body', variables_),
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
