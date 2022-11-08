import {
  CreateNotification,
  Email,
  NotificationStatus,
  NotificationType,
} from '@algomart/schemas'
import { I18nAdapter, MailerAdapter } from '@algomart/shared/adapters'
import { NotificationModel } from '@algomart/shared/models'
import { SendNotificationQueue } from '@algomart/shared/queues'
import { invariant } from '@algomart/shared/utils'
import { ResponseError } from '@sendgrid/mail'
import { UnrecoverableError } from 'bullmq'
import { TFunction } from 'i18next'
import pino from 'pino'

function isResponseError(error: unknown): error is ResponseError {
  return !!(error as ResponseError).response
}

function isUnrecoverableError(error: unknown): error is UnrecoverableError {
  return error instanceof UnrecoverableError
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
const expectVariables = (
  variables: Record<string, unknown>,
  variableNames: string[],
  logger: pino.Logger<unknown>
) => {
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

export interface NotificationsServiceOptions {
  webUrl: string
  customerServiceEmail: string
}

export class NotificationsService {
  logger: pino.Logger<unknown>
  dispatchStore: {
    [key in NotificationType]: (n: NotificationModel, t: TFunction) => Email
  } = {
    [NotificationType.AuctionComplete]:
      this.getAuctionCompleteNotification.bind(this),
    [NotificationType.PackRevoked]: this.getPackRevokedNotification.bind(this),
    [NotificationType.PaymentFailed]:
      this.getPaymentFailedNotification.bind(this),
    [NotificationType.BidExpired]: this.getBidExpiredNotification.bind(this),
    [NotificationType.ReportComplete]:
      this.getReportCompleteNotification.bind(this),
    [NotificationType.WorkflowCompleteManual]:
      this.getWorkflowCompleteManualReviewNotification.bind(this),
    [NotificationType.WorkflowCompleteRejected]:
      this.getWorkflowCompleteRejectedNotification.bind(this),
    [NotificationType.WorkflowComplete]:
      this.getWorkflowCompleteNotification.bind(this),
    [NotificationType.PaymentSuccess]:
      this.getPaymentSuccessNotification.bind(this),
    [NotificationType.TransferSuccess]:
      this.getTransferSuccessNotification.bind(this),
    [NotificationType.UserHighBid]: this.getUserHighBidNotification.bind(this),
    [NotificationType.UserOutbid]: this.getUserOutbidNotification.bind(this),
    [NotificationType.SecondarySaleSuccess]:
      this.getSecondarySaleSuccessNotification.bind(this),
    [NotificationType.SecondaryPurchaseSuccess]:
      this.getSecondaryPurchaseSuccessNotification.bind(this),
    [NotificationType.EmailPasswordReset]:
      this.getEmailPasswordResetNotification.bind(this),
    [NotificationType.NewEmailVerification]:
      this.getNewEmailVerificationNotification.bind(this),
    [NotificationType.WirePayoutSubmitted]:
      this.getWirePayoutSubmittedNotification.bind(this),
    [NotificationType.WirePayoutFailed]:
      this.getWirePayoutFailedNotification.bind(this),
    [NotificationType.WirePayoutReturned]:
      this.getWirePayoutReturnedNotification.bind(this),
  }

  constructor(
    private readonly options: NotificationsServiceOptions,
    private readonly mailer: MailerAdapter,
    private readonly i18n: I18nAdapter,
    private readonly sendNotificationQueue: SendNotificationQueue,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async createNotification(notification: CreateNotification) {
    const trx = await NotificationModel.startTransaction()
    try {
      const n = await NotificationModel.query(trx).insert({
        ...notification,
        status: NotificationStatus.Pending,
      })

      await trx.commit()

      await this.sendNotificationQueue.enqueue({
        notificationId: n.id,
      })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Dispatch a single unsent notification. Should only be called from a worker.
   * @param notificationId ID of the notification to send
   */
  async dispatchNotificationById(notificationId: string) {
    const affectedRows = await NotificationModel.query()
      .findById(notificationId)
      .where('status', NotificationStatus.Pending)
      .patch({
        status: NotificationStatus.Complete,
      })

    if (affectedRows === 0) {
      // Notification already sent or failed to send
      return
    }

    try {
      const notification = await NotificationModel.query()
        .findById(notificationId)
        .withGraphFetched('userAccount')

      invariant(
        notification.userAccount?.email,
        'Notification has no user account and/or email',
        UnrecoverableError
      )

      const {
        type,
        userAccount: { language },
      } = notification

      // Get user's language
      const t = await this.i18n.getFixedT(language, 'emails')

      const message = this.dispatchStore[type](notification, t)

      await this.mailer.sendEmail({ ...message })
    } catch (error) {
      this.logger.error(error as Error)
      // Reset status or set to failed if we cannot recover from it
      const errorMessage = isResponseError(error)
        ? error.response.body
        : error instanceof Error
        ? error.message
        : error
      await NotificationModel.query()
        .findById(notificationId)
        .patch({
          error: errorMessage,
          status: isUnrecoverableError(error)
            ? NotificationStatus.Failed
            : NotificationStatus.Pending,
        })
      throw error
    }
  }

  getAuctionCompleteNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(
      variables,
      ['amount', 'canExpire', 'packSlug', 'packTitle'],
      this.logger
    )

    const translateParams = {
      returnObjects: true,
      ctaUrl: `${this.options.webUrl}.checkout/${variables.packSlug}`,
      ...variables,
    }
    const content = <string[]>[
      t('auctionComplete.body.0', translateParams),
      t('auctionComplete.body.1', translateParams),
      t('auctionComplete.body.2', translateParams),
    ]

    // Build notification
    const body = content.reduce(
      (body: string, p: string) => body + `<p>${p}</p>`,
      ''
    )
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
    expectVariables(variables, ['packTitle'], this.logger)

    return {
      to: userAccount?.email as string,
      subject: t('bidExpired.subject', { ...variables }),
      html: t('bidExpired.body', variables),
    }
  }

  getReportCompleteNotification(n: NotificationModel, t: TFunction): Email {
    const { variables } = n
    expectVariables(
      variables,
      ['applicantId', 'userEmail', 'verificationStatus', 'url'],
      this.logger
    )

    const translateParams = {
      returnObjects: true,
      ...variables,
    }
    const content = <string[]>[
      t('reportComplete.body.0', translateParams),
      t('reportComplete.body.1', translateParams),
      t('reportComplete.body.2', translateParams),
    ]

    return {
      to: this.options.customerServiceEmail,
      subject: t('reportComplete.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getWorkflowCompleteManualReviewNotification(
    n: NotificationModel,
    t: TFunction
  ): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['status', 'url'], this.logger)

    const translateParams = {
      returnObjects: true,
      ...variables,
    }
    const content = <string[]>[
      t('workflowCompleteManualReview.body.0', translateParams),
      t('workflowCompleteManualReview.body.1', translateParams),
      t('workflowCompleteManualReview.body.2', translateParams),
    ]

    return {
      to: this.options.customerServiceEmail,
      subject: t('workflowCompleteManualReview.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getWorkflowCompleteRejectedNotification(
    n: NotificationModel,
    t: TFunction
  ): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['url', 'status'], this.logger)

    const translateParams = {
      returnObjects: true,
      applicantId: userAccount?.applicantId,
      userEmail: userAccount?.email,
      ...variables,
    }
    const content = <string[]>[
      t('workflowCompleteRejected.body.0', translateParams),
      t('workflowCompleteRejected.body.1', translateParams),
      t('workflowCompleteRejected.body.2', translateParams),
    ]

    return {
      to: this.options.customerServiceEmail,
      subject: t('workflowCompleteRejected.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getWorkflowCompleteNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['status', 'url'], this.logger)

    const translateParams = {
      returnObjects: true,
      ...variables,
    }
    const content = <string[]>[
      t('workflowComplete.body.0', translateParams),
      t('workflowComplete.body.1', translateParams),
      t('workflowComplete.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('workflowComplete.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getPaymentSuccessNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle'], this.logger)

    const translateParams = {
      returnObjects: true,
      transferUrl: `${this.options.webUrl}`,
      ...variables,
    }
    const content = <string[]>[
      t('paymentSuccess.body.0', translateParams),
      t('paymentSuccess.body.1', translateParams),
      t('paymentSuccess.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('paymentSuccess.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getTransferSuccessNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle'], this.logger)

    const translateParams = {
      returnObjects: true,
      ctaUrl: `${this.options.webUrl}/my/collectibles`,
      ...variables,
    }
    const content = <string[]>[
      t('transferSuccess.body.0', translateParams),
      t('transferSuccess.body.1', translateParams),
      t('transferSuccess.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('transferSuccess.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getUserHighBidNotification(n: NotificationModel, t: TFunction): Email {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle', 'packSlug'], this.logger)

    const translateParams = {
      returnObjects: true,
      ctaUrl: `${this.options.webUrl}/releases/${variables.packSlug}`,
      ...variables,
    }
    const content = <string[]>[
      t('userHighBid.body.0', translateParams),
      t('userHighBid.body.1', translateParams),
      t('userHighBid.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('userHighBid.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getUserOutbidNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle', 'packSlug'], this.logger)

    const translateParams = {
      returnObjects: true,
      ctaUrl: `${this.options.webUrl}/releases/${variables.packSlug}`,
      ...variables,
    }
    const content = <string[]>[
      t('userOutbid.body.0', translateParams),
      t('userOutbid.body.1', translateParams),
      t('userOutbid.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('userOutbid.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getSecondaryPurchaseSuccessNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['collectibleTitle'], this.logger)

    const translateParams = {
      returnObjects: true,
      ctaUrl: `${this.options.webUrl}/my/collectibles`,
      ...variables,
    }
    const content = <string[]>[
      t('secondaryPurchaseSuccess.body.0', translateParams),
      t('secondaryPurchaseSuccess.body.1', translateParams),
      t('secondaryPurchaseSuccess.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('secondaryPurchaseSuccess.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getSecondarySaleSuccessNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['collectibleTitle', 'amount'], this.logger)

    const translateParams = {
      returnObjects: true,
      ctaUrl: `${this.options.webUrl}/my/wallet`,
      ...variables,
    }
    const content = <string[]>[
      t('secondarySaleSuccess.body.0', translateParams),
      t('secondarySaleSuccess.body.1', translateParams),
      t('secondarySaleSuccess.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('secondarySaleSuccess.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getEmailPasswordResetNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['resetLink'], this.logger)

    const translateParams = {
      returnObjects: true,
      ctaUrl: `${this.options.webUrl}${variables.resetLink}`,
      ...variables,
    }
    const content = <string[]>[
      t('emailPasswordReset.body.0', translateParams),
      t('emailPasswordReset.body.1', translateParams),
      t('emailPasswordReset.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('emailPasswordReset.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getNewEmailVerificationNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['verificationLink'], this.logger)

    const translateParams = {
      returnObjects: true,
      ctaUrl: `${this.options.webUrl}${variables.verificationLink}`,
      ...variables,
    }
    const content = <string[]>[
      t('newEmailVerification.body.0', translateParams),
      t('newEmailVerification.body.1', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('newEmailVerification.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getPaymentFailedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle'], this.logger)
    return {
      to: userAccount?.email,
      subject: t('paymentFailed.subject'),
      html: t('paymentFailed.body', variables),
    }
  }

  getPackRevokedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['packTitle'], this.logger)
    return {
      to: userAccount?.email,
      subject: t('packRevoked.subject'),
      html: t('packRevoked.body', variables),
    }
  }

  getWirePayoutSubmittedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['amount', 'externalRef'], this.logger)

    const translateParams = {
      ctaUrl: `${this.options.webUrl}/my/wallet`,
      ...variables,
    }
    const content = <string[]>[
      t('wirePayoutSubmitted.body.0', translateParams),
      t('wirePayoutSubmitted.body.1', translateParams),
      t('wirePayoutSubmitted.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('wirePayoutSubmitted.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }

  getWirePayoutFailedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(variables, ['amount'], this.logger)

    const translateParams = {
      ctaUrl: `${this.options.webUrl}/my/wallet`,
      ...variables,
    }
    const content = <string[]>[
      t('wirePayoutFailed.body.0', translateParams),
      t('wirePayoutFailed.body.1', translateParams),
      t('wirePayoutFailed.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('wirePayoutFailed.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }
  getWirePayoutReturnedNotification(n: NotificationModel, t: TFunction) {
    const { userAccount, variables } = n
    expectVariables(
      variables,
      ['amount', 'externalRef', 'returnedAmount'],
      this.logger
    )

    const translateParams = {
      ctaUrl: `${this.options.webUrl}/my/wallet`,
      ...variables,
    }
    const content = <string[]>[
      t('wirePayoutReturned.body.0', translateParams),
      t('wirePayoutReturned.body.1', translateParams),
      t('wirePayoutReturned.body.2', translateParams),
    ]

    return {
      to: userAccount?.email as string,
      subject: t('wirePayoutReturned.subject'),
      html: content.reduce(
        (body: string, p: string) => body + `<p>${p}</p>`,
        ''
      ),
    }
  }
}
