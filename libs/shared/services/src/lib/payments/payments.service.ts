import {
  AlgorandTransactionStatus,
  CircleCreatePayment,
  CirclePaymentErrorCode,
  CirclePaymentResponse,
  CirclePaymentSourceType,
  CirclePaymentVerificationOptions,
  CircleTransferChainType,
  CircleTransferCurrencyType,
  CircleTransferStatus,
  CollectibleListingStatus,
  CreateCcPayment,
  CreateUsdcPayment,
  DEFAULT_CURRENCY,
  EntityType,
  isPurchaseAllowed,
  PaymentItem,
  PaymentOption,
  Payments,
  PaymentSortField,
  PaymentsQuerystring,
  PaymentStatus,
  PurchasePackWithCredits,
  SortDirection,
  UserAccount,
} from '@algomart/schemas'
import {
  ChainalysisAdapter,
  CircleAdapter,
  toPaymentStatus,
} from '@algomart/shared/adapters'
import {
  decodeRawSignedTransaction,
  decodeSignedTransaction,
  encodeAddress,
  isTransactionDeadError,
  UsdcAssetIdByChainType,
} from '@algomart/shared/algorand'
import {
  AlgorandTransactionGroupModel,
  CMSCachePackTemplateModel,
  CollectibleListingsModel,
  PackModel,
  PaymentCardModel,
  PaymentModel,
  UserAccountModel,
  UserAccountTransferModel,
} from '@algomart/shared/models'
import {
  PaymentData,
  SubmitPaymentQueue,
  SubmitUsdcPaymentQueue,
  UpdateCcPaymentStatusQueue,
  UpdateSettledPaymentQueue,
  UpdateUsdcPaymentStatusData,
  UpdateUsdcPaymentStatusQueue,
} from '@algomart/shared/queues'
import {
  calculateCreditCardFees,
  convertUSDFixedToBigInt,
  formatBigIntToUSDFixed,
  invariant,
  isRestrictedPurchase,
  UserError,
  userInvariant,
} from '@algomart/shared/utils'
import * as Currencies from '@dinero.js/currencies'
import { Transaction as AlgoTransaction, TransactionType } from 'algosdk'
import { UnrecoverableError } from 'bullmq'
import { enc, SHA256 } from 'crypto-js'
import { fn, Model, raw, ref, Transaction } from 'objection'
import pino from 'pino'
import { v4 as uuid } from 'uuid'

import {
  AlgorandTransactionsService,
  PacksService,
  UserAccountTransfersService,
} from '../'

export interface PaymentsServiceOptions {
  royaltyBasisPoints: number
  minimumDaysBetweenTransfers: number
  webUrl: string
  currency: Currencies.Currency<number>
  customerServiceEmail: string
  isKYCEnabled: boolean
  algorandEnvironment: string
}

export class PaymentsService {
  logger: pino.Logger<unknown>
  isKYCEnabled: boolean

  constructor(
    private readonly options: PaymentsServiceOptions,
    private readonly circle: CircleAdapter,
    private readonly packs: PacksService,
    private readonly userAccountTransfers: UserAccountTransfersService,
    private readonly submitPaymentQueue: SubmitPaymentQueue,
    private readonly submitUsdcPaymentQueue: SubmitUsdcPaymentQueue,
    private readonly transactions: AlgorandTransactionsService,
    private readonly updateCcPaymentStatusQueue: UpdateCcPaymentStatusQueue,
    private readonly updateSettledPaymentQueue: UpdateSettledPaymentQueue,
    private readonly updateUsdcPaymentStatusQueue: UpdateUsdcPaymentStatusQueue,
    private readonly chainalysis: ChainalysisAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.isKYCEnabled = options.isKYCEnabled
  }

  async getPublicKey() {
    try {
      const publicKey = await this.circle.getPublicKey()
      return publicKey
    } catch {
      return null
    }
  }

  /**
   * Marks payment as failed in the case of appropriate errors throughout payment process
   *
   * Note: It's possible that there's an error while marking the payment as failed
   * In this case the payment will be left as "pending" indefinitely in the UI even though it will never be submitted.
   */
  async markPaymentFailed(error: Error, paymentId: string, trx?: Transaction) {
    const innerTrx = trx ?? (await Model.startTransaction())

    try {
      await PaymentModel.query(innerTrx).where({ id: paymentId }).patch({
        status: PaymentStatus.Failed,
        errorDetails: error.message,
      })

      if (!trx) {
        await innerTrx.commit()
      }
    } catch (error) {
      if (!trx) {
        await innerTrx.rollback()
      }
      throw error
    }
  }

  isPaymentInFinalOrConfirmedState(status: PaymentStatus) {
    return [
      PaymentStatus.Confirmed,
      PaymentStatus.Canceled,
      PaymentStatus.Paid,
      PaymentStatus.Failed,
    ].includes(status)
  }

  isPaymentConfirmedOrPaid(status: PaymentStatus) {
    return [PaymentStatus.Confirmed, PaymentStatus.Paid].includes(status)
  }

  private async getCirclePaymentPayload(
    paymentId: string
  ): Promise<CircleCreatePayment> {
    const payment = await PaymentModel.query()
      .findById(paymentId)
      .withGraphFetched('paymentCard')

    invariant(payment, `payment ${paymentId} not found`, UnrecoverableError)

    // Question about retries: Is it possible that we're retrying a payment with a card that used
    // to exist but no longer exists? (we wouldn't want to fail here if that's possible)
    //
    // Answer: we never delete PaymentCard rows once they're in the database. If a user removes a card,
    // we just update is_saved to false. The card will still exist. So, this behavior below is correct.
    invariant(
      payment.paymentCard,
      `payment ${paymentId} has no payment card`,
      UnrecoverableError
    )

    invariant(
      payment.payload,
      `payment ${paymentId} has no payload`,
      UnrecoverableError
    )

    invariant(
      payment.idempotencyKey,
      `payment ${paymentId} has no idempotency key`,
      UnrecoverableError
    )
    invariant(
      payment.payload.verification,
      `payment ${paymentId} has no verification`,
      UnrecoverableError
    )

    const userId = payment.payerId

    // We expect to need to re-submit payments to circle if a different verification method is required
    // e.g. we try CVV but 3DS is required. For this reason, payments have 2 idempotency keys and 2 payloads
    // only idempotencyKey/payload fields are required, but if retryIdempotencyKey/retryPayload are specified they
    // will be used instead.
    const idempotencyKey = payment.retryIdempotencyKey ?? payment.idempotencyKey
    const payload = payment.retryPayload ?? payment.payload
    const { keyId, encryptedData, metadata, description, verification } =
      payload

    const cardExternalId = payment.paymentCard.externalId

    // If encrypted details are provided, add to request
    const encryptedDetails = {}
    if (keyId && encryptedData) {
      Object.assign(encryptedDetails, { keyId, encryptedData })
    }

    // If using 3DS verification, add verification urls
    const verificationDetails = {}
    if (verification === CirclePaymentVerificationOptions.three_d_secure) {
      // Circle only accepts loopback addresses
      const verificationHostname = this.options.webUrl.includes('localhost')
        ? 'http://127.0.0.1:3000'
        : this.options.webUrl

      Object.assign(verificationDetails, {
        verificationSuccessUrl: new URL(
          '/api/v1/payments/three-d-secure?status=success',
          verificationHostname
        ).toString(),

        verificationFailureUrl: new URL(
          '/api/v1/payments/three-d-secure?status=failure',
          verificationHostname
        ).toString(),
      })
    }

    return {
      ...encryptedDetails,
      ...verificationDetails,
      metadata: {
        ...metadata,
        sessionId: SHA256(userId).toString(enc.Base64),
      },
      amount: {
        amount: formatBigIntToUSDFixed(BigInt(payment.total)),
        currency: DEFAULT_CURRENCY,
      },
      description,
      source: {
        id: cardExternalId,
        type: CirclePaymentSourceType.card,
      },
      idempotencyKey,
      verification,
    }
  }

  /**
   * Called by submit-payment bull-mq worker to submit a payment to circle.
   * (So may be retried!)
   */
  async submitPaymentToCircle({ paymentId }: PaymentData) {
    const payment = await PaymentModel.query().findById(paymentId)
    invariant(payment, 'Payment not found', UnrecoverableError)

    // If payment status is anything other then "pending" or "action_required" we should no-op
    // (we'd expect "pending" most of the time, but if we're doing a second payment attempt via CVV
    // because the first attempt yielded a "3DS is not supported" error then we'd expect the status
    // to be action_required)
    invariant(
      [PaymentStatus.Pending, PaymentStatus.ActionRequired].includes(
        payment.status
      ),
      `Expected Payment status to be action_required or pending but it is: ${payment.status}`,
      UnrecoverableError
    )

    const payload = await this.getCirclePaymentPayload(paymentId)
    // The amounts below can be uncommented during development to force flows when testing 3DS verification
    // https://developers.circle.com/docs/3d-secure-authentication#triggering-specific-3ds-flows
    // challenge flow: payload.amount.amount = '5.66'
    // frictionless unsuccessful: payload.amount.amount = '5.72'
    // 3ds_not_supported failure after initial creation: payload.amount.amount = '5.76'
    const result = await this.circle.createPayment(payload)

    // If we were unable to communicate with circle the method above would throw an error
    // (and a retry should eventually occur). If circle returns an explicit error response
    // (401, 404, etc), the method above returns null
    //
    // There may be some cases where it's preferable to not to retry but it's hard to tell.
    // for now we're treating these errors as recoverable
    //
    // note: if there's e.g. an incorrect verification code provided or the card is invalid,
    // we'd still expect the payment to be created successfully (we'd expect to get a "failed"
    // Payment status notification from circle though)
    invariant(result && result.externalId, 'Circle refused to create payment')

    // If we've gotten this far, then circle returned a successful response,
    //
    // This usually means that the payment is now
    // in a 'pending' status and does not have an error, but in the event
    // of a retry, if the payment had been submitted already, the createPayment
    // endpoint will return the up to date status info. So, we _could_ update the
    // payment with the status/error information here. We choose not to do this.
    //
    // Payment status updates will also be received and processed by our webhook
    // (type: Payment or type: Settlement). So we opt not to set statuses here to avoid
    // subtle bugs caused by race conditions. (E.G. If we receive "confirmed" here, but by
    // the time we update our database, a settlement notification has updated the payment
    // status to "paid", then setting "confirmed" here would be bad)
    await PaymentModel.query()
      .where('id', paymentId)
      .where('status', payment.status)
      .patch({
        externalId: raw(
          'CASE WHEN "externalId" IS NULL THEN ?::UUID ELSE "externalId" END',
          result.externalId
        ),
        retryExternalId: raw(
          'CASE WHEN "externalId" IS NULL THEN NULL ELSE ?::UUID END',
          result.externalId
        ),
      })

    return result
  }

  async startUpdateCcPaymentStatus(payment: CirclePaymentResponse) {
    await this.updateCcPaymentStatusQueue.enqueue({ payment })
  }

  /**
   * Called by update-cc-payment-status bull-mq job (triggered when we receive a
   * notification from Circle). So may be retried!
   */
  async updateCcPaymentStatusFromWebhook(circlePayment: CirclePaymentResponse) {
    const payment = await PaymentModel.query()
      .where({ externalId: circlePayment.id })
      .orWhere({ retryExternalId: circlePayment.id })
      .first()

    // This should only ever happen if there's a super rare race condition or
    // if there's an error during a submit-payment job after the payment is submitted
    // but before we can record the externalId for lookup here. In both cases, we want
    // to let bull-mq retry this job after a delay. (In the latter case we'd expect a
    // submit-payment job retry to eventually get the external ID recorded correctly)
    invariant(payment, `Payment with external ID ${circlePayment.id} not found`)

    const newStatus = toPaymentStatus(circlePayment.status)
    let updatedPayment: PaymentModel
    if (newStatus !== payment.status) {
      if (
        newStatus === PaymentStatus.Failed &&
        (circlePayment.errorCode ===
          CirclePaymentErrorCode.three_d_secure_not_supported ||
          circlePayment.errorCode ===
            CirclePaymentErrorCode.three_d_secure_required)
      ) {
        // Attempt payment again with the unused verification method
        // Leave payment status as pending in the interim.
        // --- cvv => 3ds or 3ds => cvv
        // this all depends on what was attempted first
        await PaymentModel.query()
          .findById(payment.id)
          .patch({
            retryIdempotencyKey: uuid(),
            retryPayload: {
              ...payment.payload,
              verification:
                circlePayment.errorCode ===
                CirclePaymentErrorCode.three_d_secure_not_supported
                  ? CirclePaymentVerificationOptions.cvv
                  : CirclePaymentVerificationOptions.three_d_secure,
            },
          })
          .where({
            // only patch if these variables are not already set (this would only happen if a
            // concurrent process doing the same thing was executing, see note about retries just
            // below)
            retryIdempotencyKey: null,
            retryPayload: null,
          })
        await this.startPaymentProcessing(payment.id)
        return
      } else {
        // update payment status and clear sensitive payload data (not needed after initial submission)
        updatedPayment = await PaymentModel.query()
          .where({
            id: payment.id,
            status: payment.status,
          })
          .patch({
            action: circlePayment.requiredAction?.redirectUrl,
            status: newStatus,
            error: circlePayment.errorCode,
            payload: null,
            retryPayload: null,
            // note: its necessary to leave idempotencyKey fields in-tact due to guard against
            // race condition bugs/ retry bugs
          })
          .returning('*')
          .first()
      }
    }

    if (!updatedPayment) {
      // incase of a race condition or retry we may need to re-fetch the payment here
      updatedPayment = await PaymentModel.query().findById(payment.id)
    }

    // note: we do not call this function inside of the condition above
    // because if the function is retried because of a failure AFTER setting
    // the status but before this function finishes, we still want this function
    // to run on the retry (but newStatus !== payment.status will be false)
    if (updatedPayment.status === PaymentStatus.Confirmed) {
      await this.transferCreditsToUserWallet(updatedPayment)
    } else if (
      updatedPayment.status === PaymentStatus.Failed ||
      updatedPayment.status === PaymentStatus.Canceled
    ) {
      // Pack and Collectible unreserve
      await this.handleUnifiedPaymentItemUnreserve(
        payment.itemId,
        payment.itemType,
        payment.payerId
      )
    }
  }

  /**
   * Invoked after updating payment status during update-cc-payment-status
   * bull-mq worker process (so may be retried).
   */
  async transferCreditsToUserWallet(payment: PaymentModel) {
    invariant(
      payment.paymentCardId,
      `payment ${payment.id} has no paymentCardId`,
      UnrecoverableError
    )
    invariant(
      payment.externalId,
      `payment ${payment.id} has no externalId`,
      UnrecoverableError
    )
    invariant(
      payment.status === PaymentStatus.Confirmed ||
        payment.status === PaymentStatus.Paid,
      `payment ${payment.id} is not confirmed/paid`,
      UnrecoverableError
    )

    const paymentCard = await PaymentCardModel.query().findById(
      payment.paymentCardId
    )

    // Amount is already sent as cents, so 500 = $5.00
    const amountN = BigInt(payment.amount)
    const { amountN: transferAmountN } = calculateCreditCardFees(
      amountN,
      paymentCard.countryCode
    )

    invariant(
      transferAmountN.toString() === payment.amount,
      'amounts do not match',
      UnrecoverableError
    )

    const transfer = await this.userAccountTransfers.createUserAccountTransfer({
      amount: transferAmountN.toString(),
      entityId: payment.id,
      entityType: EntityType.Payment,
      userAccountId: payment.payerId,
      externalId: null,
    })

    await this.userAccountTransfers.startSubmitCreditsTransfer(transfer.id)

    // note: no try/catch in this method. At this point the payment status has already
    // been set, we don't want to mark it as failed at this point even if the error is
    // unrecoverable. (We'd only run into an unrecoverable error if the system was
    // misbehaving unpredictably due to a bug.)
    //
    // We also don't want to mark the transfer as failed.
    //
    // A retry should get the existing transfer queued eventually, but if it doesn't the
    // deposit will be pending indefinitely
  }

  async getPayments(
    user: UserAccount,
    {
      page = 1,
      pageSize = 10,
      sortBy = PaymentSortField.UpdatedAt,
      sortDirection = SortDirection.Ascending,
    }: PaymentsQuerystring
  ): Promise<Payments> {
    userInvariant(page > 0, 'page must be greater than 0')
    userInvariant(
      pageSize > 0 || pageSize === -1,
      'pageSize must be greater than 0'
    )
    userInvariant(
      [
        PaymentSortField.UpdatedAt,
        PaymentSortField.CreatedAt,
        PaymentSortField.Status,
      ].includes(sortBy),
      'sortBy must be one of createdAt, updatedAt, or status'
    )
    userInvariant(
      [SortDirection.Ascending, SortDirection.Descending].includes(
        sortDirection
      ),
      'sortDirection must be one of asc or desc'
    )

    // Find payments in the database
    const query = PaymentModel.query().where('payerId', user.id)

    const { results: payments, total } = await query
      .orderBy(sortBy, sortDirection)
      .page(page >= 1 ? page - 1 : page, pageSize)

    return { payments, total }
  }

  // Finds all non-failed payments that don't have a pending/ confirmed transfer.
  // This is for the /my/wallet page to display pending payments.
  //
  // Note: Failed transfers are also considered "missing", and if a payment
  // has only failed transfers associated with it, we consider that payment pending
  async getPaymentsMissingTransfersForUser(userId: string) {
    const paymentsQ = PaymentModel.query()
      .select('Payment.id', 'Payment.amount', 'Payment.createdAt')
      .leftJoin(
        'UserAccountTransfer',
        'UserAccountTransfer.entityId',
        'Payment.id'
      )
      .where('Payment.payerId', userId)
      // we don't care about failed, or canceled payments as
      // they never could have resulted in a charge
      .whereIn('Payment.status', [
        PaymentStatus.Paid,
        PaymentStatus.ActionRequired,
        PaymentStatus.Confirmed,
        PaymentStatus.Pending,
      ])
      .groupBy('Payment.id', 'Payment.amount', 'Payment.createdAt')
      .having(
        raw(
          `EVERY("UserAccountTransfer"."id" IS NULL OR "UserAccountTransfer"."status" = '${CircleTransferStatus.Failed}')`
        )
      )
      .orderBy('Payment.createdAt', 'desc')

    const payments = await paymentsQ
    return { payments, total: payments.length }
  }

  async purchasePackWithCredits(
    purchasePackWithCredits: PurchasePackWithCredits,
    user?: UserAccount
  ): Promise<UserAccountTransferModel> {
    const trx = await Model.startTransaction()
    const unifiedPurchase = !!purchasePackWithCredits.packId
    let transfer: UserAccountTransferModel
    let pack: PackModel
    try {
      invariant(
        (!unifiedPurchase && purchasePackWithCredits.packTemplateId && user) ||
          unifiedPurchase,
        'A packTemplateId and user must be provided',
        UnrecoverableError
      )

      // If unified flow, the pack has already been reserved, just find it
      // If coming in via direct credits purchase flow, find a pack to reserve
      pack = unifiedPurchase
        ? await PackModel.query(trx).findById(purchasePackWithCredits.packId)
        : await this.packs.reservePackByTemplateId(
            purchasePackWithCredits.packTemplateId,
            user,
            trx,
            false
          )

      const { content: packTemplate } = await CMSCachePackTemplateModel.query(
        trx
      ).findById(pack.templateId)

      const packPriceN = BigInt(packTemplate.price)

      // Create a pending transfer
      transfer = await this.userAccountTransfers.createUserAccountTransfer(
        {
          amount: `-${packPriceN}`,
          entityId: pack.id,
          entityType: EntityType.Pack,
          userAccountId: pack.ownerId,
        },
        trx
      )

      await trx.commit()
    } catch (error) {
      this.logger.error(error)
      // Only unreserve if unified purchase with unrecoverable error.
      // A regular purchase will get it's pack cleared in the trx rollback
      if (unifiedPurchase && error instanceof UnrecoverableError) {
        await this.packs.clearPackOwner(pack.id, user.id, trx)
      }
      await trx.rollback()
      throw error
    }

    // Queue the submit-credits-transfer job.
    // If there's an error submitting the job, mark the transfer as failed.
    //
    // Note: It's probably possible in theory that a job could be queued even if an exception is caught.
    // (some kind of connection issue after the job is queued but before bull-mq hears back from redis)
    // We are not currently handing this scenario and are not particularly worried about it occurring.
    try {
      await this.userAccountTransfers.startSubmitCreditsTransfer(transfer.id)
    } catch (error) {
      this.logger.error(error)
      const trx = await Model.startTransaction()
      try {
        await this.userAccountTransfers.markTransferFailedIfNoPayloadExists(
          error,
          transfer.id,
          trx
        )

        // If this is a unified purchase only clear pack owner if unrecoverable (currently non thrown but put in for future-proofing)
        // Otherwise if normal purchase always clear pack owner
        if (
          (unifiedPurchase && error instanceof UnrecoverableError) ||
          !unifiedPurchase
        ) {
          await this.packs.clearPackOwner(pack.id, user.id, trx)
        }
        await trx.commit()
        // Note: It's possible that there's an error while marking the transfer as failed/ reverting the claim.
        // If this happens, pack transfer will remain as "pending" indefinitely but claim process will never start
        // and the transfer will never actually occur. The pack will still be marked with the ownerId as well.
        // So, the pack will be unavailable for purchase.
      } catch (error_) {
        this.logger.error(error_)
        await trx.rollback()
        throw error_
      }
      throw error
    }

    return transfer
  }

  async purchaseListingWithCredits(
    buyerId: string,
    listingId: string
  ): Promise<UserAccountTransferModel> {
    const trx = await Model.startTransaction()
    let buyerTransfer: UserAccountTransferModel
    let updatedListing: CollectibleListingsModel
    try {
      const date = new Date().toISOString()
      updatedListing = await CollectibleListingsModel.query(trx)
        .where('id', listingId)
        // Cannot buy your own listing
        .whereNot('sellerId', buyerId)
        // Ensure the buyer has enough credits
        // note: it's really up to circle to enforce this during the credits transfer
        // (we will rollback if necessary at that point) but still worth enforcing here
        .where(
          'price',
          '<=',
          UserAccountModel.query()
            .select('balance')
            .where('id', buyerId)
            .limit(1)
        )
        .where((builder) =>
          builder
            // under most cases we need to assert that the listing is currently "active"
            .where({ status: CollectibleListingStatus.Active, claimedAt: null })
            // if this purchase is a unified credits purchase/listing purchase, then the listing would
            // have a "reserved" status and we need to assert that its claimed by this user
            .orWhere({ status: CollectibleListingStatus.Reserved, buyerId })
        )
        .patch({
          buyerId,
          purchasedAt: date,
          status: CollectibleListingStatus.TransferringCredits,
          claimedAt: raw(
            `CASE WHEN "claimedAt" IS NULL THEN ? ELSE "claimedAt" END`,
            date
          ),
        })
        .returning('*')
        .first()

      invariant(
        updatedListing,
        'Listing no longer available',
        UnrecoverableError
      )

      // Note: the following is not ideal, but does work to ensure the right
      // amount is deposited to the seller and withdrawn from the buyer. Since
      // the amounts are slightly different between the two, just transferring
      // from the buyer to the seller will not be sufficient.

      // Transfer credits from buyer to merchant wallet
      // We rely on a negative amount to ensure this is a withdrawal.
      buyerTransfer = await this.userAccountTransfers.createUserAccountTransfer(
        {
          amount: String(-updatedListing.price),
          entityId: updatedListing.id,
          entityType: EntityType.CollectibleListings,
          userAccountId: buyerId,
        },
        trx
      )

      const BASIS_POINTS = 10_000
      // Transfer credits from merchant to seller wallet
      // We keep the royalty fee in the merchant wallet
      // We rely on a positive amount to ensure this is a deposit.
      const royaltyFee = Math.floor(
        (updatedListing.price * this.options.royaltyBasisPoints) / BASIS_POINTS
      )
      const amountToTransferWithFeeRemoved = updatedListing.price - royaltyFee
      await this.userAccountTransfers.createUserAccountTransfer(
        {
          amount: String(amountToTransferWithFeeRemoved),
          entityId: updatedListing.id,
          entityType: EntityType.CollectibleListings,
          userAccountId: updatedListing.sellerId,
        },
        trx
      )

      await trx.commit()
    } catch (error) {
      this.logger.error(error)
      await trx.rollback()
      // We don't always do listing reservation in this trx, so we want to make sure to explicitly unreserve
      if (error instanceof UnrecoverableError) {
        // this will no-op if not a unified purchase
        await this.clearListingReservation(listingId, buyerId)
      }
      throw error
    }

    // If the buyer transfer fails to be queued, we revert the listing
    // and they can try again.
    // We will queue the seller transfer when the buyer transfer is complete,
    // but they will see that there is a pending transfer for the sale.
    try {
      await this.userAccountTransfers.startSubmitCreditsTransfer(
        buyerTransfer.id
      )
    } catch (error) {
      this.logger.error(error)
      // Only clear pack owner if unrecoverable (currently non thrown but put in for future-proofing)
      if (error instanceof UnrecoverableError) {
        await this.clearListingReservation(listingId, buyerId)
      }
      throw error
    }

    return buyerTransfer
  }

  // Analyzes purchase history for user, for both cards and crypto sources
  // Returns the total sum of payment amounts for the user, both in the last 24 hours + all-time
  async getUserKycTotals(userId: string, trx?: Transaction) {
    // query to total pending and completed payments for this user
    const sumAllPayments = PaymentModel.query(trx)
      .select(
        // the coalesce is so we get zero if no rows are found (otherwise sum would return null)
        fn.coalesce(fn.sum(ref('total')), 0).as('amount')
      )
      .where({
        payerId: userId,
      })
      .whereNotIn('status', [PaymentStatus.Canceled, PaymentStatus.Failed])
      .first()
      // this doesn't cast anything but it's here to satisfy TS
      .castTo<{ amount: string }>()

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const sumLast24hPayments = sumAllPayments
      .clone()
      .whereBetween('createdAt', [oneDayAgo, new Date()])

    const [last24hPaymentsSumResult, totalPaymentsSumResult] =
      await Promise.all([sumLast24hPayments, sumAllPayments])

    const last24hPaymentsSum = Number(last24hPaymentsSumResult.amount)
    const totalPaymentsSum = Number(totalPaymentsSumResult.amount)

    return { daily: last24hPaymentsSum, all: totalPaymentsSum }
  }

  async validatePaymentAmountAgainstKycRestrictions({
    user,
    amount,
    trx,
    method,
  }: {
    user: UserAccount
    amount: number | bigint
    trx: Transaction
    method: PaymentOption
  }) {
    // get users daily/ all time kyc totals not considering this payment
    const kycTotals = await this.getUserKycTotals(user.id, trx)

    // add this payment's amount to the user's totals to see if the purchase surpasses
    // one of the limits (isRestricted)
    const {
      isRestricted,
      dailyAmountBeforeVerification,
      totalAmountBeforeVerification,
    } = isRestrictedPurchase(kycTotals.daily, kycTotals.all, amount)

    // if the purchase surpasses one of the limits and there's no workflow ID for the user
    // then the purchase is definitely not allowed
    userInvariant(
      !isRestricted || user.lastWorkflowRunId,
      'Purchase restricted and workflow for applicant not found',
      404
    )

    // If we have a workflow run for this user, then check the user's verification status
    // if necessary. Note: this function accepts an additional "amount" parameter, but
    // [total/daily]AmountBeforeVerification already have amount accounted for, so we
    // don't provide an amount argument here.
    const isAllowed = isPurchaseAllowed(
      {
        isVerificationEnabled: this.isKYCEnabled,
        isVerificationRequired: isRestricted,
        status: user.verificationStatus,
        totalAmountBeforeVerification,
        dailyAmountBeforeVerification,
      },
      null,
      method
    )
    userInvariant(isAllowed, 'user is unable to make purchases', 400)
    return
  }

  async createCcPayment(user: UserAccount, paymentDetails: CreateCcPayment) {
    // we only want to run the insert if the kyc queries yield sums that are less
    // than our limits. To avoid race conditions, we'd *ideally* like to check the sums and perform the insert
    // conditionally in a single query. Coding this was proving quite difficult in the
    // case of this query though, so we chose instead to use a short-lived row-lock on the UserAccount.
    const trx = await Model.startTransaction()
    let payment: PaymentModel
    try {
      const paymentCard = await PaymentCardModel.query(trx).findById(
        paymentDetails.cardId
      )

      await UserAccountModel.query(trx)
        .select()
        .forUpdate()
        .where('id', user.id)

      // The user needs to complete KYC if they've reached Circle's limits
      const amounts = calculateCreditCardFees(
        BigInt(paymentDetails.amount),
        paymentCard.countryCode
      )

      await this.validatePaymentAmountAgainstKycRestrictions({
        user,
        amount: amounts.totalN,
        trx,
        method: PaymentOption.Card,
      })

      // If we've gotten this far then KYC verification is either complete or not required
      const itemId = await this.handleUnifiedPaymentItemReserve(
        paymentDetails.itemType,
        paymentDetails.itemId,
        user,
        trx
      )

      // Attempt CVV verification first
      // If the verification type fails, we later retry with the other one
      const verification = CirclePaymentVerificationOptions.cvv
      // const verification = CirclePaymentVerificationOptions.three_d_secure
      payment = await PaymentModel.query(trx).insert({
        payerId: user.id,
        status: PaymentStatus.Pending,
        externalId: null,
        paymentCardId: paymentDetails.cardId,
        payload: { ...paymentDetails, verification },
        itemId,
        itemType: paymentDetails.itemType,
        idempotencyKey: uuid(),
        amount: amounts.amountN.toString(),
        fees: amounts.feesN.toString(),
        total: amounts.totalN.toString(),
      })

      await trx.commit()
    } catch (error) {
      // We do item reservation and payment querying in the same trx so we don't need to manually unreserve
      this.logger.error(error)
      await trx.rollback()
      throw error
    }

    userInvariant(
      payment,
      'Unable to create payment because KYC limits would be exceeded',
      400
    )

    // Queue the submit-payment job.
    // If there's an error submitting the job, mark the payment as failed and unreserve any claimed items.
    //
    // Note: It's probably possible in theory that a job could be queued even if an exception is caught.
    // (some kind of connection issue after the job is queued but before bull-mq hears back from redis)
    // We are not currently handing this scenario and are not particularly worried about it occurring.
    try {
      await this.startPaymentProcessing(payment.id)
    } catch (error) {
      const trx = await Model.startTransaction()
      this.logger.error(error)

      await this.markPaymentFailed(error, payment.id, trx)

      await this.handleUnifiedPaymentItemUnreserve(
        payment.itemId,
        payment.itemType,
        payment.payerId,
        trx
      )

      await trx.commit()
      throw error
    }

    return payment
  }

  /**
   * Receives the signed and encoded transaction for this user
   * decodes the transaction to get the amount and the destination address
   * checks:
   *   kyc based on amount and user
   *   confirm the destination address in the transaction is a circle blockchain address for the users wallet
   *   via circle API
   *
   * then:
   *    creates payment row and AlgorandTransaction rows.
   *    queue submit-usdc-payment job
   */
  async createUsdcPayment(
    user: UserAccount,
    paymentDetails: CreateUsdcPayment
  ) {
    // get amount, destination address, etc from the transaction object
    let transactionAddress: string
    let microUsdcAmount: number | bigint
    let destinationAddress: string
    let algoTrx: AlgoTransaction
    try {
      algoTrx = await decodeSignedTransaction(
        paymentDetails.encodedSignedTransaction
      )
      microUsdcAmount = algoTrx.amount
      transactionAddress = algoTrx.txID()
      destinationAddress = await encodeAddress(algoTrx.to)
    } catch (error) {
      this.logger.error(error)
      throw new UserError('Could not decode signed algorand transaction', 400)
    }

    // Verify that the destination address is not sanctioned
    const { isMatch } = await this.verifyBlockchainAddress(destinationAddress)
    userInvariant(!isMatch, 'blockchain address is sanctioned', 400)

    userInvariant(
      microUsdcAmount &&
        transactionAddress &&
        destinationAddress &&
        algoTrx.type === TransactionType.axfer &&
        algoTrx.assetIndex ===
          UsdcAssetIdByChainType[this.options.algorandEnvironment] &&
        algoTrx.genesisID.startsWith(this.options.algorandEnvironment) &&
        !algoTrx.reKeyTo &&
        !algoTrx.closeRemainderTo &&
        !algoTrx.assetRevocationTarget &&
        !algoTrx.group,
      'Transaction is mis-configured'
    )

    const amountInCents = BigInt(microUsdcAmount) / 10_000n

    // confirm that the destination address is a circle deposit address connected
    // to the  user's circle wallet
    const address = await this.circle.getBlockchainAddress(
      user.externalWalletId,
      destinationAddress
    )
    userInvariant(
      address,
      'Transaction destination address does not match a registered deposit address in user circle account'
    )
    userInvariant(
      address.chain === CircleTransferChainType.ALGO &&
        address.currency === CircleTransferCurrencyType.USD,
      'Blockchain address is misconfigured'
    )

    // we only want to run the insert if the kyc queries yield sums that are less
    // than our limits. To avoid race conditions, we'd *ideally* like to check the sums and perform the insert
    // conditionally in a single query. Coding this was proving quite difficult in the
    // case of this query though, so we chose instead to use a short-lived row-lock on the UserAccount.
    const trx = await Model.startTransaction()
    let payment: PaymentModel
    try {
      await UserAccountModel.query(trx)
        .select()
        .forUpdate()
        .where('id', user.id)

      await this.validatePaymentAmountAgainstKycRestrictions({
        user,
        amount: amountInCents,
        trx,
        method: PaymentOption.USDC,
      })

      const itemId = await this.handleUnifiedPaymentItemReserve(
        paymentDetails.itemType,
        paymentDetails.itemId,
        user,
        trx
      )

      const transactionGroup = await AlgorandTransactionGroupModel.query(trx)
        .insertGraph({
          transactions: [
            {
              address: transactionAddress,
              status: AlgorandTransactionStatus.Signed,
              encodedSignedTransaction: paymentDetails.encodedSignedTransaction,
              order: 0,
            },
          ],
        })
        .returning('*')

      payment = await PaymentModel.query(trx).insert({
        amount: amountInCents.toString(),
        destinationAddress,
        externalId: null,
        fees: '0', // No additional fees for crypto payments
        itemId,
        itemType: paymentDetails.itemType,
        payerId: user.id,
        paymentCardId: null,
        status: PaymentStatus.Pending,
        total: amountInCents.toString(),
        transferId: null,
        usdcDepositAlgorandTransactionId: transactionGroup.transactions[0].id,
      })

      await trx.commit()
    } catch (error) {
      // We do item reservation and payment querying in the same trx so we don't need to manually unreserve
      this.logger.error(error)
      await trx.rollback()
      throw error
    }

    // Queue a submit-usdc-payment job
    // If there's an error submitting the job, mark the payment as failed and unreserve any claimed items.
    try {
      await this.startSubmitUsdcPayment(payment.id)
    } catch (error) {
      const trx = await Model.startTransaction()
      this.logger.error(error)
      await this.markPaymentFailed(error, payment.id, trx)

      await this.handleUnifiedPaymentItemUnreserve(
        payment.itemId,
        payment.itemType,
        payment.payerId,
        trx
      )

      await trx.commit()
      throw error
    }

    return payment
  }

  async startPaymentProcessing(paymentId: string) {
    await this.submitPaymentQueue.enqueue({
      paymentId,
    })
  }

  async findTransferByPaymentId(user: UserAccount, paymentId: string) {
    // returns undefined if not found
    const transfer =
      await this.userAccountTransfers.getUserAccountTransferByEntityId(
        user,
        paymentId,
        EntityType.Payment
      )
    return transfer
  }

  async startSubmitUsdcPayment(paymentId: string) {
    await this.submitUsdcPaymentQueue.enqueue({
      paymentId,
    })
  }

  async submitUsdcDepositAlgorandTransaction({ paymentId }: PaymentData) {
    const payment = await PaymentModel.query()
      .findById(paymentId)
      .withGraphFetched('usdcDepositAlgorandTransaction')

    const algorandTransaction = payment.usdcDepositAlgorandTransaction
    invariant(payment, 'Payment not found', UnrecoverableError)
    invariant(
      !payment.paymentCardId,
      'Payment is not a USDC deposit',
      UnrecoverableError
    )
    invariant(
      algorandTransaction,
      'Payment has no deposit algorand transaction',
      UnrecoverableError
    )

    // In the event of a retry, no need to re-submit if already confirmed
    if (algorandTransaction.status === AlgorandTransactionStatus.Confirmed) {
      return
    }

    invariant(
      !!algorandTransaction.encodedSignedTransaction,
      'Algorand Transaction record is missing encoded/signed data'
    )
    const transactionIds = [algorandTransaction.address]
    const signedTransactions = [
      decodeRawSignedTransaction(algorandTransaction.encodedSignedTransaction),
    ]
    // this will throw unless the transaction is able to be confirmed and recorded as such
    try {
      await this.transactions.submitAndWaitForTransactionsIfNecessary(
        signedTransactions,
        transactionIds
      )
    } catch (error) {
      if (isTransactionDeadError(error)) {
        // Special case: if a submission failed because the transaction was created too many rounds ago,
        // then it is safe to mark the payment as failed so that the user can re-submit
        await this.markPaymentFailed(error, payment.id)
        throw new UnrecoverableError(error.message)
      }
      // Unknown issue. Throw error so that a retry can occur
      throw error
    }
  }

  async startUpdateUsdcPaymentStatus(data: UpdateUsdcPaymentStatusData) {
    // note: if there's a failure queueing the job then bull MQ retry mechanism should
    // eventually re-invoke this step, but it's still technically possible
    // for a payment to be submitted and for the next job to never be enqueued
    // (so no UserAccountTransfer is created and Payment stays as "Pending" indefinitely)
    //
    // It's correct to consider these payments "pending". We will need either an automatic refund
    // or a support process put in place at some point
    await this.updateUsdcPaymentStatusQueue.enqueue(data)
  }

  // This is called after the algorand usdc deposit transaction has been submitted
  // search for circle transfers
  async updateUsdcPaymentStatus({ transfer }: UpdateUsdcPaymentStatusData) {
    let payment: PaymentModel
    let paymentAmountN: bigint
    try {
      payment = await PaymentModel.query()
        .findOne({
          destinationAddress: transfer.destination.address,
        })
        .withGraphFetched('payer')

      invariant(payment, 'Payment not found', UnrecoverableError)
      invariant(
        payment.payer.externalWalletId,
        'Payer/wallet ID not found',
        UnrecoverableError
      )
      invariant(
        payment.destinationAddress,
        'Payment destination address not found',
        UnrecoverableError
      )

      // Note: From Circle
      //   "The initial state for any incoming USDC deposit to a Circle deposit address will be “pending” as opposed to running.
      //   You should first receive this “pending” notification when we identify the incoming transfer,
      //   including the transactionHash, and this will then be followed (potentially pretty much
      //   immediately depending on the chain) by the “complete” notification.
      //   If the deposit enters the “failed” state, this means that the transfer will never complete"
      // So in the case of failure we should mark the payment as failed, and they can try again
      // as they were never charged.
      // One relevant guide is here https://developers.circle.com/docs/receive-external-funds
      if (transfer.status === CircleTransferStatus.Failed) {
        await PaymentModel.query()
          .where({
            id: payment.id,
            status: PaymentStatus.Pending,
          })
          .patch({
            status: PaymentStatus.Failed,
            error: transfer.errorCode,
          })
        return
      }

      const transferAmountN = convertUSDFixedToBigInt(transfer.amount.amount)
      paymentAmountN = BigInt(payment.amount)
      invariant(
        transferAmountN === paymentAmountN,
        'Transfer amount must equal payment amount',
        UnrecoverableError
      )
    } catch (error) {
      if (error instanceof UnrecoverableError) {
        // Pack and Collectible unreserve
        await this.handleUnifiedPaymentItemUnreserve(
          payment.itemId,
          payment.itemType,
          payment.payerId
        )
      }

      throw error
    }

    // Mark the payment as Paid and insert a UserAccountTransfer row
    const trx = await Model.startTransaction()
    try {
      const paymentWasUpdated = await PaymentModel.query(trx)
        .where({
          id: payment.id,
          // only write if Payment status is pending for safety
          status: PaymentStatus.Pending,
        })
        .patch({
          status: PaymentStatus.Paid,
        })

      let userAccountTransfer: UserAccountTransferModel
      if (paymentWasUpdated) {
        // insert a new transfer (pending status)
        userAccountTransfer =
          await this.userAccountTransfers.createUserAccountTransfer(
            {
              amount: paymentAmountN.toString(),
              entityId: payment.id,
              entityType: EntityType.Payment,
              userAccountId: payment.payer.id,
            },
            trx
          )

        // mark it as complete immediately
        // (the user account balance trigger only runs on update)
        await UserAccountTransferModel.query(trx)
          .findById(userAccountTransfer.id)
          .patch({
            status: CircleTransferStatus.Complete,
          })
      }

      await trx.commit()

      return userAccountTransfer
    } catch (error) {
      this.logger.error(error)
      await trx.rollback()
      throw error
    }
  }

  /**
   * Creates a one time use blockchain address to send funds to which
   * proxies funds to the users circle wallet
   */
  async generateBlockchainAddressForUsdcDeposit(user: UserAccount) {
    // might need to create a circle wallet if this is the user's first deposit
    const userWallet =
      await this.userAccountTransfers.createOrGetUserCircleWallet(user.id)
    userInvariant(user, 'User not found', 404)
    const address = await this.circle.createBlockchainAddress({
      idempotencyKey: uuid(),
      walletId: userWallet.walletId,
    })
    userInvariant(address, 'wallet could not be created', 401)
    return address
  }

  async verifyBlockchainAddress(address: string) {
    userInvariant(address, 'no address provided', 404)
    // Verify blockchain address with Chainalysis
    const identifications = await this.chainalysis.verifyBlockchainAddress(
      address
    )
    userInvariant(
      identifications,
      'address could not be checked for verification',
      401
    )
    if (identifications.length > 0) return { isMatch: true }
    return { isMatch: false }
  }

  async getPaymentById(userId: string, paymentId: string) {
    // Note: this should not be used by the admin pages. Create separate AdminService for that.
    const payment: PaymentModel = await PaymentModel.query()
      // During the 3DS redirect process there are times when the front end only knows the external ID.
      // So, we support looking up both ways implicitly. There should never be a case where one payments
      // ID matches another payments externalId and vice-versa because they are UUID-v4 strings.
      .where((builder) =>
        builder
          .where({ id: paymentId })
          .orWhere({ externalId: paymentId })
          .orWhere({ retryExternalId: paymentId })
      )
      .where('payerId', userId)
      .first()

    userInvariant(payment, 'payment not found', 404)
    return payment
  }

  async startUpdateSettledPayment(settlementId: string) {
    await this.updateSettledPaymentQueue.enqueue({ settlementId })
  }

  async updateSettledPayments(settlementId: string) {
    const payments = await this.circle.getPayments({
      settlementId,
    })

    const trx = await Model.startTransaction()
    try {
      for (const payment of payments) {
        await PaymentModel.query(trx)
          .where({ externalId: payment.externalId })
          .orWhere({ retryExternalId: payment.externalId })
          .patch({
            status: payment.status,
          })
      }
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Handles getting the payment associated with a transfer and then
   * completing a unified payment flow depending on itemType
   *
   * Called by update-credits-transfer-status and update-usdc-payment-status bull-mq workers
   * (So may be retried!)
   */
  async handleUnifiedPaymentHandoff(transfer: UserAccountTransferModel) {
    const payment = await this.getPaymentById(
      transfer.userAccountId,
      transfer.entityId
    )

    invariant(
      payment?.itemId,
      'Payment associated with transfer does not have item id, cannot continue with unified payment handoff',
      UnrecoverableError
    )

    switch (payment.itemType) {
      case PaymentItem.Pack: {
        await this.purchasePackWithCredits({ packId: payment.itemId })
        break
      }
      case PaymentItem.Collectible: {
        await this.purchaseListingWithCredits(
          transfer.userAccountId,
          payment.itemId
        )
        break
      }
    }
  }

  async handleUnifiedPaymentItemReserve(
    itemType: PaymentItem,
    itemId: string,
    user: UserAccount,
    trx?: Transaction
  ) {
    let _itemId: string

    invariant(user, 'User must be provided to reserve item')

    switch (itemType) {
      case PaymentItem.Pack: {
        // If unified pack purchase we need to swap a template id for a specific pack id
        const pack = await this.packs.reservePackByTemplateId(
          itemId,
          user,
          trx,
          true
        )
        _itemId = pack?.id
        break
      }
      case PaymentItem.Collectible: {
        const collectibleListing = await this.reserveListing(
          itemId,
          user?.id,
          trx
        )
        _itemId = collectibleListing?.id
        break
      }
      default: {
        _itemId = itemId
      }
    }

    return _itemId
  }

  /**
   * Pack and Collectible unreserve
   * Used in the case of applicable error throughout the payment process
   *
   * Note: It's possible that there's an error while unreserving the item
   * In this case the item will be left in a claimed state and be unpurchasable.
   **/
  async handleUnifiedPaymentItemUnreserve(
    itemId: string,
    itemType: EntityType | PaymentItem,
    userId: string,
    trx?: Transaction
  ) {
    // This could probably be cleaned up. Handles unreserving from payment or from transfer
    switch (itemType) {
      case EntityType.Pack:
      case PaymentItem.Pack: {
        await this.packs.clearPackOwner(itemId, userId, trx)
        break
      }
      case EntityType.Collectible:
      case PaymentItem.Collectible: {
        await this.clearListingReservation(itemId, userId, trx)
        break
      }
    }
  }

  async reserveListing(listingId: string, buyerId: string, trx?: Transaction) {
    const innerTrx = trx ?? (await Model.startTransaction())
    let collectibleListing: CollectibleListingsModel
    try {
      const claimedAt = new Date().toISOString()

      collectibleListing = await CollectibleListingsModel.query(innerTrx)
        .where('id', listingId)
        .where('claimedAt', null)
        .where('purchasedAt', null)
        .where((qb) =>
          qb.orWhere('expiresAt', '<=', new Date()).orWhere('expiresAt', null)
        )
        .patch({
          buyerId,
          claimedAt,
          status: CollectibleListingStatus.Reserved,
        })
        .returning('*')
        .first()

      userInvariant(
        collectibleListing,
        'No available listing found for listing ID',
        404
      )

      if (!trx) await innerTrx.commit()
    } catch (error) {
      if (!trx) await innerTrx.rollback()
      throw error
    }

    return collectibleListing
  }

  async clearListingReservation(
    listingId: string,
    userId: string,
    trx?: Transaction
  ) {
    const innerTrx = trx ?? (await Model.startTransaction())
    try {
      const listing = await CollectibleListingsModel.query(innerTrx)
        .where('id', listingId)
        .where('buyerId', userId)
        .first()

      if (listing) {
        await CollectibleListingsModel.query(innerTrx).patch({
          buyerId: null,
          claimedAt: null,
          purchasedAt: null,
          status: CollectibleListingStatus.Active,
        })
      }

      if (!trx) await innerTrx.commit()
    } catch (error) {
      if (!trx) await innerTrx.rollback()
      throw error
    }
  }
}
