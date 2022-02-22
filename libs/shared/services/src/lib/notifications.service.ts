import pino from 'pino'
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

import { I18nAdapter, MailerAdapter } from '@algomart/shared/adapters'
import { EventModel, NotificationModel } from '@algomart/shared/models'
import { invariant } from '@algomart/shared/utils'

const isResponseError = (error: unknown): error is ResponseError => {
  return typeof (error as ResponseError).response?.body === 'string'
}
export default class NotificationsService {
  logger: pino.Logger<unknown>
  dispatchStore: {
    [key in NotificationType]: (n: NotificationModel, t: TFunction) => Email
  } = {
    [NotificationType.AuctionComplete]:
      this.getAuctionCompleteNotification.bind(this),
    [NotificationType.BidExpired]: this.getBidExpiredNotification.bind(this),
    [NotificationType.PaymentSuccess]:
      this.getPaymentSuccessNotification.bind(this),
    [NotificationType.TransferSuccess]:
      this.getTransferSuccessNotification.bind(this),
    [NotificationType.UserHighBid]: this.getUserHighBidNotification.bind(this),
    [NotificationType.UserOutbid]: this.getUserOutbidNotification.bind(this),
    [NotificationType.WireInstructions]:
      this.getWireInstructionsNotification.bind(this),
  }

  constructor(
    private readonly mailer: MailerAdapter,
    private readonly i18n: I18nAdapter,
    private readonly webUrl: string,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

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
        // Ensure recipient
        if (!notification?.userAccount?.email) {
          throw new Error(`Notification "${notification.id}" has no recipient`)
        }

        // Get recipient's locale
        const {
          type,
          id,
          userAccountId,
          userAccount: { locale },
        } = notification
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

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(typeof variables.amount === 'string', 'amount is required')
    invariant(typeof variables.canExpire === 'boolean', 'canExpire is required')
    invariant(typeof variables.packSlug === 'string', 'packSlug is required')
    invariant(typeof variables.packTitle === 'string', 'packTitle is required')

    // Build notification
    const body = (
      t('auctionComplete.body', {
        returnObjects: true,
        ctaUrl: `${this.webUrl}checkout/${variables.packSlug}`,
        ...variables,
      }) as string[]
    ).reduce((body: string, p: string) => body + `<p>${p}</p>`, '')

    const html = variables.canExpire
      ? body + `<p>${t('auctionComplete.expirationWarning')}</p>`
      : body

    const message = {
      to: userAccount?.email as string,
      subject: t('auctionComplete.subject'),
      html,
    }
    return message
  }

  getBidExpiredNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(typeof variables.packTitle === 'string', 'packTitle is required')

    // Build notification
    const message = {
      to: userAccount?.email as string,
      subject: t('bidExpired.subject', { ...variables }),
      html: t<string[]>('bidExpired.body', {
        returnObjects: true,
        ...variables,
      }).reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }

    return message
  }

  getPaymentSuccessNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(typeof variables.packTitle === 'string', 'packTitle is required')

    const html = t<string[]>('paymentSuccess.body', {
      returnObjects: true,
      transferUrl: `${this.webUrl}`,
      ...variables,
    })

    // Build notification
    const message = {
      to: userAccount?.email as string,
      subject: t('paymentSuccess.subject'),
      html: html.reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
    return message
  }

  getTransferSuccessNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(typeof variables.packTitle === 'string', 'packTitle is required')

    const html = t<string[]>('transferSuccess.body', {
      returnObjects: true,
      ctaUrl: `${this.webUrl}my/collectibles`,
      ...variables,
    })

    // Build notification
    const message = {
      to: userAccount?.email as string,
      subject: t('transferSuccess.subject'),
      html: html.reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
    return message
  }

  getUserHighBidNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(typeof variables.packSlug === 'string', 'packSlug is required')
    invariant(typeof variables.packTitle === 'string', 'packTitle is required')

    // Build notification
    const message = {
      to: userAccount?.email as string,
      subject: t('userHighBid.subject'),
      html: (
        t('userHighBid.body', {
          returnObjects: true,
          ctaUrl: `${this.webUrl}releases/${variables.packSlug}`,
          ...variables,
        }) as string[]
      ).reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
    return message
  }

  getUserOutbidNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(typeof variables.packSlug === 'string', 'packSlug is required')
    invariant(typeof variables.packTitle === 'string', 'packTitle is required')

    // Build notification
    const message = {
      to: userAccount?.email as string,
      subject: t('userOutbid.subject'),
      html: (
        t('userOutbid.body', {
          returnObjects: true,
          ctaUrl: `${this.webUrl}releases/${variables.packSlug}`,
          ...variables,
        }) as string[]
      ).reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
    return message
  }

  getWireInstructionsNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(
      typeof variables.trackingRef === 'string',
      'trackingRef is required'
    )
    invariant(
      typeof variables.beneficiaryName === 'string',
      'beneficiaryName is required'
    )
    invariant(
      typeof variables.beneficiaryAddress1 === 'string',
      'beneficiaryAddress1 is required'
    )
    invariant(
      typeof variables.beneficiaryAddress2 === 'string',
      'beneficiaryAddress2 is required'
    )
    invariant(
      typeof variables.beneficiaryBankName === 'string',
      'beneficiaryBankName is required'
    )
    invariant(
      typeof variables.beneficiaryBankSwiftCode === 'string',
      'beneficiaryBankSwiftCode is required'
    )
    invariant(
      typeof variables.beneficiaryBankRoutingNumber === 'string',
      'beneficiaryBankRoutingNumber is required'
    )
    invariant(
      typeof variables.beneficiaryBankAccountingNumber === 'string',
      'beneficiaryBankAccountingNumber is required'
    )
    invariant(
      typeof variables.beneficiaryBankAddress === 'string',
      'beneficiaryBankAddress is required'
    )
    invariant(
      typeof variables.beneficiaryBankCity === 'string',
      'beneficiaryBankCity is required'
    )
    invariant(
      typeof variables.beneficiaryBankPostalCode === 'string',
      'beneficiaryBankPostalCode is required'
    )
    invariant(
      typeof variables.beneficiaryBankCountry === 'string',
      'beneficiaryBankCountry is required'
    )

    // Build notification
    const body = (
      t('wireTransfer.body', {
        returnObjects: true,
        ctaUrl: `${this.webUrl}checkout/${variables.packSlug}`,
        ...variables,
      }) as string[]
    ).reduce((body: string, p: string) => body + `<p>${p}</p>`, '')

    const html = variables.canExpire
      ? body + `<p>${t('wireTransfer.expirationWarning')}</p>`
      : body

    const message = {
      to: userAccount?.email as string,
      subject: t('wireTransfer.subject'),
      html,
    }

    return message
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
