import {
  CreateNotification,
  DEFAULT_LOCALE,
  Email,
  EventAction,
  EventEntityType,
  NotificationStatus,
  NotificationType,
} from '@algomart/schemas'
import i18next, { TFunction } from 'i18next'
import Backend from 'i18next-fs-backend'
import { Transaction } from 'objection'

import { Configuration } from '@/configuration'
import SendgridAdapter, { SendgridResponseError } from '@/lib/sendgrid-adapter'
import { EventModel } from '@/models/event.model'
import { NotificationModel } from '@/models/notification.model'
import { invariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

export default class NotificationsService {
  logger = logger.child({ context: this.constructor.name })
  dispatchStore: {
    [key in NotificationType]: (n: NotificationModel, t: TFunction) => Email
  } = {
    [NotificationType.AuctionComplete]: this.getAuctionCompleteNotification,
    [NotificationType.BidExpired]: this.getBidExpiredNotification,
    [NotificationType.TransferSuccess]: this.getTransferSuccessNotification,
    [NotificationType.UserHighBid]: this.getUserHighBidNotification,
    [NotificationType.UserOutbid]: this.getUserOutbididNotification,
  }

  constructor(private readonly sendgrid: SendgridAdapter) {}

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
        const { userAccount, type, id, userAccountId } = notification
        await i18next.use(Backend).init({
          backend: { loadPath: `./locales/${userAccount.locale}/emails.json` },
          fallbackLng: DEFAULT_LOCALE,
        })

        // Attempt to send notification
        try {
          const message = this.dispatchStore[type](
            notification,
            i18next.t.bind(i18next)
          )
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

  getAuctionCompleteNotification(n: NotificationModel, t: TFunction) {
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

  getBidExpiredNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(typeof variables.packTitle === 'string', 'packTitle is required')

    // Build notification
    const message = {
      to: userAccount?.email as string,
      subject: t('bidExpired.subject', { ...variables }),
      html: (
        t('bidExpired.body', {
          returnObjects: true,
          ...variables,
        }) as string[]
      ).reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
    return message
  }

  getTransferSuccessNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n

    // Validate variables
    invariant(variables, 'no variables were provided for this notification')
    invariant(typeof variables.packTitle === 'string', 'packTitle is required')

    // Build notification
    const message = {
      to: userAccount?.email as string,
      subject: t('transferSuccess.subject'),
      html: (
        t('transferSuccess.body', {
          returnObjects: true,
          ctaUrl: `${Configuration.webUrl}my/collectibles`,
          ...variables,
        }) as string[]
      ).reduce((body: string, p: string) => body + `<p>${p}</p>`, ''),
    }
    return message
  }

  getUserHighBidNotification(n: NotificationModel, t: TFunction) {
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

  getUserOutbididNotification(n: NotificationModel, t: TFunction) {
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
    let error: string | undefined
    try {
      await this.sendgrid.sendEmail({ ...message })
    } catch (error_) {
      error = JSON.stringify(
        (error_ as SendgridResponseError).response.body.errors.map(
          ({ message }) => message
        )
      )
    }

    // Update notification with with status (and error if applicable)
    await NotificationModel.query(trx)
      .where('id', notificationId)
      .patch({
        error: error ?? null,
        status: error ? NotificationStatus.Failed : NotificationStatus.Complete,
      })

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityType: EventEntityType.Notification,
      entityId: notificationId,
      userAccountId,
    })
  }
}
