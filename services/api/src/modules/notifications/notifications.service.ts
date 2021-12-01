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
export default class NotificationsService {
  logger = logger.child({ context: this.constructor.name })
  dispatchStore: {
    [key in NotificationType]: (n: NotificationModel, t: TFunction) => Email
  } = {
    [NotificationType.AuctionComplete]:
      this.getAuctionCompleteNotification.bind(this),
    [NotificationType.BidExpired]: this.getBidExpiredNotification.bind(this),
    [NotificationType.TransferSuccess]:
      this.getTransferSuccessNotification.bind(this),
    [NotificationType.UserHighBid]: this.getUserHighBidNotification.bind(this),
    [NotificationType.UserOutbid]: this.getUserOutbidNotification.bind(this),
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
        ctaUrl: `${Configuration.webUrl}checkout?pack=${variables.packSlug}`,
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

  getTransferSuccessNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(typeof variables.packTitle === 'string', 'packTitle is required')

    const html = t<string[]>('transferSuccess.body', {
      returnObjects: true,
      ctaUrl: `${Configuration.webUrl}my/collectibles`,
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
          ctaUrl: `${Configuration.webUrl}releases/${variables.packSlug}`,
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
          ctaUrl: `${Configuration.webUrl}releases/${variables.packSlug}`,
          ...variables,
        }) as string[]
      ).reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
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
