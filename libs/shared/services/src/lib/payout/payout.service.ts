import {
  CircleCreateWirePayoutRequest,
  CirclePayout,
  CirclePayoutDestinationType,
  CirclePayoutErrorCode,
  CirclePayoutStatus,
  CircleReturn,
  CircleTransferSourceType,
  CircleTransferStatus,
  CollectibleListingStatus,
  DEFAULT_CURRENCY,
  EntityType,
  InitiateUsdcPayoutRequest,
  InitiateWirePayoutRequest,
  MIN_PAYOUT_AMOUNT_CENTS,
  NotificationType,
  PaymentStatus,
  UserAccount,
  UserAccountStatus,
  UserAccountTransferCreate,
  WIRE_PAYOUT_FEE_AMOUNT_CENTS,
} from '@algomart/schemas'
import { CircleAdapter, OnfidoAdapter } from '@algomart/shared/adapters'
import {
  CollectibleListingsModel,
  PayoutModel,
  UserAccountModel,
  UserAccountTransferModel,
  WireBankAccountModel,
  WirePayoutModel,
} from '@algomart/shared/models'
import {
  ReturnWirePayoutData,
  ReturnWirePayoutQueue,
  SubmitWirePayoutData,
  SubmitWirePayoutQueue,
  UpdateWirePayoutStatusData,
  UpdateWirePayoutStatusQueue,
} from '@algomart/shared/queues'
import {
  addDays,
  convertUSDFixedToBigInt,
  formatBigIntToUSDFixed,
  invariant,
  userInvariant,
} from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import { Model, raw, Transaction } from 'objection'
import pino from 'pino'
import { v4 as uuid } from 'uuid'

import {
  AccountsService,
  NotificationsService,
  PaymentsService,
  UserAccountTransfersService,
} from '..'

export interface PayoutServiceOptions {
  minimumDaysBeforeCashout: number
}

export class PayoutService {
  logger: pino.Logger<unknown>
  constructor(
    private readonly options: PayoutServiceOptions,
    private readonly transfers: UserAccountTransfersService,
    private readonly accounts: AccountsService,
    private readonly onfido: OnfidoAdapter,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
    private readonly submitWirePayoutQueue: SubmitWirePayoutQueue,
    private readonly updateWirePayoutStatusQueue: UpdateWirePayoutStatusQueue,
    private readonly returnWirePayoutQueue: ReturnWirePayoutQueue,
    private readonly circle: CircleAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async initiateWirePayout(
    user: UserAccount,
    payload: InitiateWirePayoutRequest
  ) {
    // Add the flat successful wire fee to the amount
    const amountToPayoutN = BigInt(payload.amount)
    const amountToPayoutWithFeesN =
      amountToPayoutN + BigInt(WIRE_PAYOUT_FEE_AMOUNT_CENTS)
    const minWithFeeTotalN = BigInt(
      WIRE_PAYOUT_FEE_AMOUNT_CENTS + MIN_PAYOUT_AMOUNT_CENTS
    )
    userInvariant(
      amountToPayoutWithFeesN >= minWithFeeTotalN,
      `Amount plus fee must be at least ${
        MIN_PAYOUT_AMOUNT_CENTS + WIRE_PAYOUT_FEE_AMOUNT_CENTS / 100
      }USD`
    )

    // Verify they have enough balance to cover the payout and fee
    // This is also checked as part of the insert query
    const { availableBalance } = await this.getBalanceAvailableForPayout(user)
    userInvariant(
      amountToPayoutWithFeesN <= availableBalance,
      'Insufficient balance'
    )

    const wireBankAccount = await WireBankAccountModel.query().findById(
      payload.wireBankAccountId
    )
    userInvariant(wireBankAccount, 'WireBankAccount not found', 404)

    let transfer

    // This payload will not include the fee, the fee will be taken out of the master wallet
    // by circle.
    const createPayload: CircleCreateWirePayoutRequest = {
      idempotencyKey: uuid(),
      source: {
        type: CircleTransferSourceType.wallet,
        id: await this.circle.getMasterWalletId(),
      },
      destination: {
        id: wireBankAccount.externalId,
        type: CirclePayoutDestinationType.WIRE,
      },
      amount: {
        currency: DEFAULT_CURRENCY,
        amount: formatBigIntToUSDFixed(amountToPayoutN),
      },
      metadata: {
        beneficiaryEmail: user.email,
      },
    }

    const trx = await Model.startTransaction()
    try {
      // Create a pending WirePayout, this will be submitted to circle when the
      // transfer to the merchant wallet is successful.
      const wirePayout = await WirePayoutModel.query(trx).insert({
        userId: user.id,
        wireBankAccountId: payload.wireBankAccountId,
        createPayload,
        status: CirclePayoutStatus.Pending,
      })
      // Create a transfer for the amount + fee to the merchant wallet
      transfer = await this.createUserAccountTransferForPayout(
        user.id,
        {
          amount: String(-amountToPayoutWithFeesN),
          userAccountId: user.id,
          entityId: wirePayout.id,
          entityType: EntityType.WirePayout,
          externalId: null,
        },
        trx
      )
      await trx.commit()
    } catch (error) {
      trx.rollback()
      this.logger.error(error)
      throw error
    }

    try {
      // Submit the balance transfer to the merchant wallet
      await this.transfers.startSubmitCreditsTransfer(transfer.id)
    } catch (error) {
      const trx = await Model.startTransaction()
      this.logger.error(error)
      // Mark as failed, user can retry
      await WirePayoutModel.query(trx).where({ id: transfer.entityId }).patch({
        status: CirclePayoutStatus.Failed,
      })
      await UserAccountTransferModel.query(trx)
        .where({ id: transfer.id })
        .patch({
          status: CircleTransferStatus.Failed,
        })
      throw error
    }

    return transfer
  }

  async startSubmitWirePayout(wirePayoutId: string) {
    await this.submitWirePayoutQueue.enqueue({ wirePayoutId })
  }

  async submitWirePayoutToCircle({ wirePayoutId }: SubmitWirePayoutData) {
    // Find the payout with a completed balance transfer
    const payout = await WirePayoutModel.query()
      .findById(wirePayoutId)
      .withGraphFetched('transfers(initialWireTransfer)')
    invariant(
      payout && payout.transfers[0]?.status === CircleTransferStatus.Complete,
      'WirePayout not found',
      UnrecoverableError
    )

    // Submit to circle, if failed the operation is idempotent and the job will be retried
    const result = await this.circle.createWirePayout(payout.createPayload)
    invariant(result, 'Failed to create wire payout in circle')

    await WirePayoutModel.query().where({ id: payout.id }).patch({
      externalId: result.id,
      sourceWalletId: result.sourceWalletId,
      destination: result.destination,
      amount: result.amount,
      fees: result.fees,
      // This will be pending
      status: result.status,
      // At this point these should be null
      return: result.return,
      riskEvaluation: result.riskEvaluation,
      trackingRef: result.trackingRef,
      externalRef: result.externalRef,
      error: result.errorCode,
    })

    return result
  }

  async startUpdateWirePayoutStatus(payout: UpdateWirePayoutStatusData) {
    await this.updateWirePayoutStatusQueue.enqueue(payout)
  }

  async startReturnWirePayout(circleReturn: ReturnWirePayoutData) {
    await this.returnWirePayoutQueue.enqueue(circleReturn)
  }

  async markWirePayoutAsFailed(
    wirePayout: WirePayoutModel,
    circlePayout: CirclePayout
  ) {
    let refundTransfer: UserAccountTransferModel | null = null

    const trx = await Model.startTransaction()
    try {
      // Update the wire payout with information from circle about the failed payout
      await WirePayoutModel.query(trx)
        .where({ id: wirePayout.id, status: CirclePayoutStatus.Pending })
        .patch({
          fees: circlePayout.fees,
          status: CirclePayoutStatus.Failed,
          riskEvaluation: circlePayout.riskEvaluation,
          error: circlePayout.errorCode,
        })
      // Mark the original transfer as failed (The UI will show the successful refund)
      const originalTransfer = await UserAccountTransferModel.query(trx)
        .findById(wirePayout.transfers[0]?.id)
        .where({
          status: CircleTransferStatus.Complete,
        })
        .patch({
          status: CircleTransferStatus.Failed,
        })
        .returning('*')
        .first()
      // Since the payout request failed, we need to refund the user
      // The original amount - the fees amount (if any)
      const originalTransferAmountN = BigInt(originalTransfer.amount)
      const feesAmountN = circlePayout.fees?.amount
        ? convertUSDFixedToBigInt(circlePayout.fees.amount)
        : 0n
      // In case this transaction succeeded, but startSubmitCreditsTransfer fails
      // the previously created transfer will be returned to submit in retries.
      refundTransfer = await this.transfers.createUserAccountTransfer(
        {
          amount: String(-originalTransferAmountN - feesAmountN),
          userAccountId: originalTransfer.userAccountId,
          entityId: wirePayout.id,
          entityType: EntityType.WirePayoutFailedRefund,
          externalId: null,
        },
        trx
      )
      await trx.commit()
    } catch (error) {
      trx.rollback()
      this.logger.error(error)
      // Job will be retried
      throw error
    }

    try {
      await this.transfers.startSubmitCreditsTransfer(refundTransfer.id)
    } catch (error) {
      this.logger.error(error)
      // Job will be retried
      throw error
    }

    // If this create notification fails the job will be retried
    // this would result in startSubmitCreditsTransfer to be called again
    // but the circle operations are idempotent so it should not be a problem
    // See: setCirclePayoutTransferPayloadIfNecessary
    await this.notifications.createNotification({
      type: NotificationType.WirePayoutFailed,
      userAccountId: wirePayout.userId,
      variables: {
        amount: circlePayout.amount.amount,
      },
    })
  }

  async markWirePayoutFailedWithoutBeingSubmitted(wirePayoutId: string) {
    // In the case the transfer from the user wallet to the merchant wallet fails,
    // we just mark the WirePayout as failed as it was never submitted.
    // The transfer was already marked as failed
    const payout = await WirePayoutModel.query().findById(wirePayoutId)
    invariant(payout, 'WirePayout not found', UnrecoverableError)
    await WirePayoutModel.query().where({ id: wirePayoutId }).patch({
      status: CirclePayoutStatus.Failed,
      error: 'Inital payout transfer to merchant wallet failed',
    })
  }

  async markWirePayoutAsComplete(
    wirePayout: WirePayoutModel,
    circlePayout: CirclePayout
  ) {
    await WirePayoutModel.query()
      .where({ id: wirePayout.id, status: CirclePayoutStatus.Pending })
      .patch({
        trackingRef: circlePayout.trackingRef,
        externalRef: circlePayout.externalRef,
        fees: circlePayout.fees,
        status: CirclePayoutStatus.Complete,
      })

    await this.notifications.createNotification({
      type: NotificationType.WirePayoutSubmitted,
      userAccountId: wirePayout.userId,
      variables: {
        amount: circlePayout.amount.amount,
        externalRef: circlePayout.externalRef,
      },
    })
  }

  async updateWirePayoutStatus(payout: UpdateWirePayoutStatusData) {
    const pendingWirePayout = await WirePayoutModel.query()
      .findOne({
        status: CirclePayoutStatus.Pending,
        externalId: payout.id,
      })
      .withGraphFetched('transfers(initialWireTransfer)')
    invariant(
      pendingWirePayout && pendingWirePayout.transfers[0],
      'Pending WirePayout not found',
      UnrecoverableError
    )
    if (payout.status === CirclePayoutStatus.Failed) {
      await this.markWirePayoutAsFailed(pendingWirePayout, payout)
    }
    if (payout.status === CirclePayoutStatus.Complete) {
      await this.markWirePayoutAsComplete(pendingWirePayout, payout)
    }
  }

  async handleReturnedWirePayout(circleReturn: CircleReturn) {
    const wirePayout = await WirePayoutModel.query()
      .findOne({
        externalId: circleReturn.payoutId,
        status: CirclePayoutStatus.Complete,
      })
      .withGraphFetched('transfers(initialWireTransfer)')

    invariant(
      wirePayout && wirePayout.transfers[0],
      'WirePayout not found for return',
      UnrecoverableError
    )
    const trx = await Model.startTransaction()
    // Set info about the return on the wire payout
    await WirePayoutModel.query(trx).where({ id: wirePayout.id }).patch({
      status: CirclePayoutStatus.Complete,
      return: circleReturn,
      error: CirclePayoutErrorCode.transaction_returned,
    })

    // The amount refunded may differ from the original amount
    // if the bank takes fees
    // https://developers.circle.com/docs/make-a-payout#payout-action
    const amountRefundedN = convertUSDFixedToBigInt(circleReturn.amount.amount)
    // Refund users balance
    // In case this transaction succeeded, but startSubmitCreditsTransfer fails
    // the previously created transfer will be returned to submit in retries.
    const { id } = await this.transfers.createUserAccountTransfer(
      {
        amount: String(amountRefundedN),
        userAccountId: wirePayout.transfers[0]?.userAccountId,
        entityId: wirePayout.id,
        entityType: EntityType.WirePayoutReturn,
        externalId: null,
      },
      trx
    )
    await trx.commit()

    await this.transfers.startSubmitCreditsTransfer(id)

    // If this create notification fails the job will be retried
    // this would result in startSubmitCreditsTransfer to be called again
    // but the circle operations are idempotent so it should not be a problem
    // See: setCirclePayoutTransferPayloadIfNecessary
    await this.notifications.createNotification({
      type: NotificationType.WirePayoutReturned,
      userAccountId: wirePayout.userId,
      variables: {
        amount: wirePayout.amount.amount,
        returnedAmount: circleReturn.amount.amount,
        externalRef: wirePayout.externalRef,
      },
    })
  }

  async initiateUsdcPayout(
    user: UserAccount,
    payload: InitiateUsdcPayoutRequest
  ) {
    userInvariant(
      this.onfido.isEnabled,
      'KYC must be enabled to support payouts',
      404
    )

    const amountToPayoutN = BigInt(payload.amount)
    userInvariant(
      amountToPayoutN >= BigInt(MIN_PAYOUT_AMOUNT_CENTS),
      `Amount must be at least ${MIN_PAYOUT_AMOUNT_CENTS / 100}USD`
    )

    // Verify that the destination address is not sanctioned
    const { isMatch } = await this.payments.verifyBlockchainAddress(
      payload.destinationAddress
    )
    userInvariant(!isMatch, 'blockchain address is sanctioned', 400)

    // This will actually be checked in the insert query
    // but we will pretty much always be able to catch it here
    // and provide a better error message
    const { availableBalance } = await this.getBalanceAvailableForPayout(user)
    userInvariant(amountToPayoutN <= availableBalance, 'Insufficient balance')

    // Check KYC verification status
    const { verificationStatus } = await this.accounts.getByExternalId({
      userExternalId: user.externalId,
    })
    userInvariant(
      verificationStatus === UserAccountStatus.Clear ||
        verificationStatus === UserAccountStatus.Approved,
      'User must complete KYC process to withdraw funds'
    )

    let transfer
    const trx = await Model.startTransaction()
    try {
      const payout = await PayoutModel.query(trx).insert({
        userId: user.id,
        destinationAddress: payload.destinationAddress,
      })
      transfer = await this.createUserAccountTransferForPayout(
        user.id,
        {
          amount: String(-amountToPayoutN),
          userAccountId: user.id,
          entityId: payout.id,
          entityType: EntityType.Payout,
          externalId: null,
        },
        trx
      )
      await trx.commit()
    } catch (error) {
      trx.rollback()
      this.logger.error(error)
      throw error
    }

    // Queue the submit-credits-transfer job.
    // If there's an error submitting the job, mark the transfer as failed.
    //
    // Note: It's probably possible in theory that a job could be queued even if an exception is caught.
    // (some kind of connection issue after the job is queued but before bull-mq hears back from redis)
    // We are not currently handing this scenario and are not particularly worried about it occurring.
    try {
      await this.transfers.startSubmitCreditsTransfer(transfer.id)
    } catch (error) {
      this.logger.error(error)
      await this.transfers.markTransferFailedIfNoPayloadExists(
        error,
        transfer.id
      )
      // Note: It's possible that there's an error while marking the transfer as failed. In this case
      // the transfer will be left as "pending" indefinitely in the UI even though it will never be submitted.
      throw error
    }

    return transfer
  }

  async createUserAccountTransferForPayout(
    userId: string,
    transfer: UserAccountTransferCreate,
    trx?: Transaction
  ) {
    // This query is used to check the users balance before creating the transfer.
    // Because we let them spend credits before payments are settled their
    // available balance could be < 0 (ex. buy and spend 40 credits via the direct flow
    // they'll have a 0 balance and 40 pending credits so available = -40)
    // so in that case we just return 0.
    const whereSubQuery = UserAccountTransferModel.query(trx)
      .with('pending', this.getPendingBalanceQueryForUserById(userId))
      .with(
        'user_account',
        UserAccountModel.query().findById(userId).select('balance')
      )
      .select(
        raw(`
            CASE
              WHEN user_account.balance - pending."pendingAmount" < 0 THEN 0
            ELSE
              user_account.balance - pending."pendingAmount"
            END available
          `)
      )
      .from('user_account')
      .crossJoin(raw('pending'))

    // We need the positive value to check against the available balance
    const absoluteAmount =
      BigInt(transfer.amount) < 0n
        ? -BigInt(transfer.amount)
        : BigInt(transfer.amount)

    const knex = Model.knex()
    // This query is used to create the transfer if the user currently has enough
    // available balance to cash out the requested amount.
    // Could not find a reasonable way to do this INSERT INTO name (...) SELECT ... FROM ...
    // in objection, so we're using knex directly.
    const insertSql = knex
      .into(
        knex.raw(
          '"UserAccountTransfer" (id, amount, "entityType", "entityId", "externalId", status, "userAccountId")'
        )
      )
      .insert(function () {
        this.select(
          knex.raw('?, ?, ?, ?, ?, ?, ?', [
            uuid(),
            transfer.amount,
            transfer.entityType,
            transfer.entityId,
            transfer.externalId,
            CircleTransferStatus.Pending,
            transfer.userAccountId,
          ])
        )
        this.whereRaw(':amount <= :available', {
          amount: `${absoluteAmount}`,
          available: whereSubQuery.toKnexQuery(),
        })
      })
      .returning('*')
      .toString()

    // Make the query in the transaction
    const insertResult = await (trx ?? knex).raw(insertSql)
    const insertedTransfer = insertResult.rows[0]

    invariant(
      insertedTransfer,
      'Could not insert transfer, likely insufficient available balance'
    )

    return insertedTransfer
  }

  async getBalanceAvailableForPayout(userAccount: UserAccount) {
    // Ensure we fetch the latest user account balance
    const user = await UserAccountModel.query().findById(userAccount.id)
    const totalBalance = BigInt(user.balance)

    const { pendingAmount } = await this.getPendingBalanceQueryForUserById(
      userAccount.id
    )
      .first()
      .castTo<{ pendingAmount: string }>()

    const available = totalBalance - BigInt(pendingAmount)
    const availableBalance = available < 0n ? 0n : available

    return { availableBalance }
  }

  /**
   * Gets the sum of all transfers where
   * 1. It is a pending transfer for a Marketplace Purchase, Pack purchase, or Payout
   * 2. The related payment is in CONFIRMED state
   *    OR the related payment is in PAID state but has only been
   *    in the PAID state for less than the minimum # of days before cashout
   *    AND is not a USDCA credit purchase
   * @param userId The UserAccount Id
   * @returns QueryBuilder instance
   */
  private getPendingBalanceQueryForUserById(userId: string) {
    // We also want to consider marketplace purchases that are in the "reserved" state
    // because they will not have a corresponding user UserAccountTransfer.
    const pendingSecondaryMarketPurchasesWithoutTransfers =
      CollectibleListingsModel.query()
        .select(raw('COALESCE(SUM(price), 0)'))
        .where('buyerId', userId)
        .andWhere('status', CollectibleListingStatus.Reserved)
        .toKnexQuery()
        .toString()

    return UserAccountTransferModel.query()
      .alias('uat')
      .select(
        raw(
          `COALESCE(SUM(ABS(uat.amount)), 0) + (${pendingSecondaryMarketPurchasesWithoutTransfers}) AS "pendingAmount"`
        )
      )
      .leftJoin('Payment as pmt', 'uat.entityId', 'pmt.id')
      .where('uat.userAccountId', userId)
      .andWhere((andQb) => {
        // Marketplace purchases, pack purchases, and payouts
        andQb
          .where((nonPaymentQb) => {
            // Include all pending transfers for marketplace purchases, pack purchases, and payouts
            // that are for a negative amount (ie. Exclude the amount of any pending sales the
            // user may have from marketplace)
            nonPaymentQb
              .whereIn('uat.entityType', [
                EntityType.Pack,
                EntityType.Payout,
                EntityType.WirePayout,
                EntityType.CollectibleListings,
              ])
              .andWhere('uat.status', CircleTransferStatus.Pending)
              // Exclude marketplace sales from pending amount
              .andWhere('uat.amount', '<', 0)
          })
          // Credit purchases
          .orWhere((paymentQb) => {
            // Include all transfers related to payments that are in COMPLETE state
            // (pending will not be reflected in their balance so they are ignored)
            // where the payment is either in CONFIRMED state or the payment is in PAID state
            // but has only been in the PAID state for less than the minimum # of days before cashout
            // AND is not a USDCA credit purchase
            paymentQb
              .where('uat.entityType', EntityType.Payment)
              .where('uat.status', CircleTransferStatus.Complete)
              .andWhere((settledQb) => {
                settledQb
                  // Confirmed is not yet settled
                  .where('pmt.status', PaymentStatus.Confirmed)
                  .orWhere((orWhereQb) => {
                    orWhereQb
                      // Paid still has to wait N days
                      .where('pmt.status', PaymentStatus.Paid)
                      .andWhere(
                        'pmt.updatedAt',
                        '>=',
                        addDays(
                          new Date(),
                          -this.options.minimumDaysBeforeCashout
                        ).toISOString()
                      )
                      // USDC-A credit purchases don't need to wait
                      .whereNotNull('pmt.paymentCardId')
                  })
              })
          })
      })
  }
}
