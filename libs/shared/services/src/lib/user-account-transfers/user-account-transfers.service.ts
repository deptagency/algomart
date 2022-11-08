import {
  CircleCreateWalletTransferPayoutRequest,
  CircleCreateWalletTransferRequest,
  CircleCreateWalletTransferResponse,
  CircleTransferChainType,
  CircleTransferCurrencyType,
  CircleTransferDestinationType,
  CircleTransferSourceType,
  CircleTransferStatus,
  CircleWallet,
  CircleWirePayoutPublicDetails,
  DEFAULT_LANG,
  DirectusCollectibleTemplate,
  DirectusPackTemplate,
  EntityType,
  UserAccount,
  UserAccountTransferAction,
  UserAccountTransferCreate,
  UserAccountTransfersQuery,
  UserAccountTransfersResponse,
  UserAccountTransferType,
} from '@algomart/schemas'
import { CircleAdapter } from '@algomart/shared/adapters'
import {
  PayoutModel,
  UserAccountModel,
  UserAccountTransferModel,
} from '@algomart/shared/models'
import {
  SubmitCreditsTransferData,
  SubmitCreditsTransferQueue,
  UpdateCreditsTransferData,
  UpdateCreditsTransferStatusQueue,
} from '@algomart/shared/queues'
import {
  exponentialThenDailyBackoff,
  formatBigIntToUSDFixed,
  invariant,
  userInvariant,
} from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import { Model, QueryBuilder, Transaction } from 'objection'
import pino from 'pino'
import { v4 as uuid } from 'uuid'

import {
  CMSCacheServiceOptions,
  toCollectibleBase,
  toPackBase,
} from '../cms-cache.service'

export class UserAccountTransfersService {
  logger: pino.Logger<unknown>
  constructor(
    private readonly options: CMSCacheServiceOptions,
    private readonly circle: CircleAdapter,
    private readonly submitCreditsTransferQueue: SubmitCreditsTransferQueue,
    private readonly updateCreditsTransferStatusQueue: UpdateCreditsTransferStatusQueue,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  isTransferInFinalStatus(status: CircleTransferStatus) {
    return [
      CircleTransferStatus.Complete,
      CircleTransferStatus.Failed,
    ].includes(status)
  }

  // If a service method (called by a bull-mq worker) has explicitly thrown an unrecoverable
  // error, then mark payment as failed. Otherwise we'd expect an eventual retry to occur.
  //
  // Note: this function only sets status to failed if no circleTransferPayload is found. This
  // function is meant to be called by job steps that occur prior to sending the payload. Once
  // a payload is set, we consider the request sent, so the only time we want to mark a payment
  // failed at that point is if we've actually received a "failed" status from circle when
  // submitting it or checking its status
  async markTransferFailedIfErrorIsUnrecoverableAndNoPayloadExists(
    error: Error,
    transferId: string
  ) {
    if (error instanceof UnrecoverableError) {
      await this.markTransferFailedIfNoPayloadExists(error, transferId)
    }
  }

  async markTransferFailedIfNoPayloadExists(
    error: Error,
    transferId: string,
    trx?: Transaction
  ) {
    const innerTrx = trx ?? (await Model.startTransaction())
    try {
      await UserAccountTransferModel.query()
        .where({ id: transferId, circleTransferPayload: null })
        .patch({
          status: CircleTransferStatus.Failed,
          errorDetails: error.message,
          creditsTransferJobCompletedAt: new Date().toISOString(),
        })
      if (!trx) await innerTrx.commit()
    } catch (error_) {
      if (!trx) await innerTrx.rollback()
      throw error_
    }
    throw error
  }

  /**
   * Deposits positive amounts to the user's account and withdraws negative
   * amounts to the merchant wallet.
   * @param transfer Transfer creation object
   * @param transfer.amount Amount to be transferred
   * @param transfer.entityId Foreign entity ID to reference for the transfer
   * @param transfer.entityType Entity type to reference for the transfer
   * @param transfer.userAccountId User account to transfer from or to
   * @param transfer.externalId Optional external ID to reference for the transfer
   * @param trx Optional transaction to wrap the creation in
   * @returns The created user account transfer
   */
  async createUserAccountTransfer(
    transfer: UserAccountTransferCreate,
    trx?: Transaction
  ) {
    let fetchedTransfer: UserAccountTransferModel
    const innerTrx = trx ?? (await Model.startTransaction())
    try {
      // Insert a new Transfer for the provided entityId so long as another non-failed transfer
      // does not exist for said entity. If another non-failed transfer does exist or the entity,
      // then just return the pre-existing transfer. (This mechanism relies on a postgres partial
      // unique index)
      const insert = UserAccountTransferModel.query(innerTrx)
        .insert({
          // we have to bypass objection to do the insert, so we need to generate the ID ourselves
          id: uuid(),
          amount: transfer.amount,
          entityId: transfer.entityId,
          entityType: transfer.entityType,
          externalId: transfer.externalId,
          status: CircleTransferStatus.Pending,
          userAccountId: transfer.userAccountId,
        })
        .onConflict()
        .ignore()
        .returning('*')

      const insertQuery = insert.toKnexQuery().toString()
      // Bypass objection to do the insert. Objection does some magic with the return values of the
      // insert and would incorrectly return a row value even if the query did not actually result in
      // an insert, native postgres wont actually return a row in this scenario and we need postgres'
      // behavior
      const result = await innerTrx.raw(insertQuery)
      fetchedTransfer = result.rows[0]

      // The insert above could predictably no-op if only one non-failed transfer is allowed per entity.
      // If there's another non-failed transfer for this entity, then we want to queue the job for that
      // transfer rather than create a new one.
      if (!fetchedTransfer) {
        fetchedTransfer = await UserAccountTransferModel.query(innerTrx)
          .where({
            entityType: transfer.entityType,
            entityId: transfer.entityId,
            userAccountId: transfer.userAccountId,
          })
          .whereNot('status', CircleTransferStatus.Failed)
          .first()

        invariant(
          fetchedTransfer,
          // Either another user transfer is in progress for a different entity or its possible that we're
          // retrying a transfer that just failed between the time the insert ran and the select ran
          // in either case, throw a (recoverable) error so that the worker can try again
          'Could not insert transfer and could not find existing non-failed transfer'
        )
      }

      if (!trx) await innerTrx.commit()
    } catch (error) {
      if (!trx) await innerTrx.rollback()
      throw error
    }

    return fetchedTransfer
  }

  async startSubmitCreditsTransfer(userAccountTransferId: string, delay = 0) {
    await this.submitCreditsTransferQueue.enqueue(
      {
        userAccountTransferId,
      },
      delay
    )
  }

  async searchTransfers(
    user: UserAccount,
    {
      page = 1,
      pageSize = 10,
      language = DEFAULT_LANG,
      status = [CircleTransferStatus.Complete],
      joinCollectible = true,
      joinListing = true,
      joinPack = true,
      joinWirePayout = true,
    }: UserAccountTransfersQuery
  ): Promise<UserAccountTransfersResponse> {
    const queryBuild: QueryBuilder<UserAccountTransferModel> =
      UserAccountTransferModel.query().whereIn('status', status)

    queryBuild.where('userAccountId', user.id)

    if (joinPack) {
      // Get related pack
      queryBuild.withGraphFetched('pack.[template]')
    }

    if (joinCollectible) {
      // Get related collectible
      queryBuild.withGraphFetched('collectible.[template]')
    }

    if (joinListing) {
      // Get related listing
      queryBuild.withGraphFetched('listing.[collectible.[template]]')
    }

    if (joinWirePayout) {
      // Get related wire payout
      queryBuild.withGraphFetched('wirePayout')
    }

    const { total, results } = await queryBuild
      .page(page - 1, pageSize != -1 ? pageSize : Number.MAX_SAFE_INTEGER)
      .orderBy('createdAt', 'desc')

    const mappedTransfers = results.map((transfer) => {
      const amount = BigInt(transfer.amount)
      const isCredit = amount < 0

      let pack = null
      if (transfer.pack) {
        const { title, image } = toPackBase(
          transfer.pack.template.content as unknown as DirectusPackTemplate,
          this.options,
          language
        )

        pack = {
          id: transfer.pack.id,
          image,
          title,
        }
      }

      const listing = transfer.listing
        ? {
            id: transfer.listing.id,
          }
        : null

      let collectible = null
      let wirePayout: CircleWirePayoutPublicDetails = null
      if (transfer.listing) {
        const { title, image } = toCollectibleBase(
          transfer.listing.collectible?.template
            .content as unknown as DirectusCollectibleTemplate,
          this.options,
          language
        )

        collectible = {
          id: transfer.listing.collectible.id,
          title,
          image,
        }
      } else if (transfer.collectible) {
        const { title, image } = toCollectibleBase(
          transfer.listing.collectible?.template
            .content as unknown as DirectusCollectibleTemplate,
          this.options,
          language
        )

        collectible = {
          id: transfer.listing.collectible.id,
          title,
          image,
        }
      } else if (transfer.wirePayout) {
        wirePayout = {
          destinationName: transfer.wirePayout.destination?.name || '',
          externalRef: transfer.wirePayout.externalRef,
          trackingRef: transfer.wirePayout.trackingRef,
          fees: transfer.wirePayout.fees,
          return: transfer.wirePayout.return,
          status: transfer.wirePayout.status,
        }
      }

      return {
        action: this.getTransferAction(
          isCredit,
          collectible !== null,
          pack !== null
        ),
        amount: amount.toString(),
        collectible,
        wirePayout,
        createdAt: transfer.createdAt,
        entityId: transfer.entityId,
        listing,
        pack,
        status: transfer.status,
        type: isCredit
          ? UserAccountTransferType.Credit
          : UserAccountTransferType.Debit,
      }
    })

    return {
      total,
      transfers: mappedTransfers,
    }
  }

  private getTransferAction(
    isCredit: boolean,
    hasCollectible: boolean,
    hasPack: boolean
  ) {
    if (hasCollectible) {
      return isCredit
        ? UserAccountTransferAction.CollectiblePurchase
        : UserAccountTransferAction.CollectibleSale
    }
    if (!hasCollectible && !hasPack) {
      return isCredit
        ? UserAccountTransferAction.CashOut
        : UserAccountTransferAction.Deposit
    }
    return UserAccountTransferAction.PackPurchase
  }

  async getUserAccountTransferByEntityId(
    user: UserAccount,
    entityId: string,
    entityType?: EntityType
  ) {
    const transfer = await UserAccountTransferModel.query()
      .findOne({
        entityId,
        entityType,
        userAccountId: user.id,
      })
      .skipUndefined()

    return transfer
  }

  async getUserAccountTransferById(id: string) {
    const transfer = await UserAccountTransferModel.query().findById(id)
    userInvariant(transfer, 'transfer not found', 404)
    return transfer
  }

  async createCircleTransferForUserAccountTransfer({
    userAccountTransferId,
  }: SubmitCreditsTransferData) {
    let transfer: UserAccountTransferModel
    try {
      transfer = await UserAccountTransferModel.query().findById(
        userAccountTransferId
      )
      invariant(
        transfer,
        `userAccountTransfer ${userAccountTransferId} not found`,
        UnrecoverableError
      )

      if (this.isTransferInFinalStatus(transfer.status)) {
        // transfer already complete or failed, no need to submit transfer
        // note: this does not necessarily mean the job is done
        return
      }

      const merchantWallet = await this.circle.getMerchantWallet()

      // If we were unable to communicate with circle the method above would throw an error
      // (and a retry should eventually occur). If circle returns an explicit error response
      // (401, 404, etc), the method above returns null
      //
      // There may be some cases where it's preferable to not to retry but it's hard to tell.
      // for now we're treating these errors as recoverable
      invariant(merchantWallet, `merchant wallet not found`)

      // If this is the first ever user transfer, we'll have to create a circle wallet for this
      // user, otherwise just retrieve the existing wallet. If the wallet can't be retrieved or
      // created the function will throw and exception
      const userWallet = await this.createOrGetUserCircleWallet(
        transfer.userAccountId
      )

      // Use absolute value of amount to ensure circle transfer is positive
      const amountN = BigInt(transfer.amount)
      const isDebit = amountN > BigInt(0)
      const absAmountN = isDebit ? amountN : -amountN

      let walletTransfer: CircleCreateWalletTransferResponse

      if (transfer.entityType === EntityType.Payout) {
        // If transfer is a payout, User -> Non Custodial
        const payout = await PayoutModel.query().findById(transfer.entityId)
        invariant(payout, `payout not found`, UnrecoverableError)
        invariant(
          payout.destinationAddress,
          `payout destination address not found, bank not supported yet`,
          UnrecoverableError
        )
        const fromWallet = userWallet.walletId
        const toAddress = payout.destinationAddress
        // in the event of a race condition, this function may return a pre-existing
        // recorded payload
        const payload = await this.setCirclePayoutTransferPayloadIfNecessary(
          userAccountTransferId,
          fromWallet,
          toAddress,
          formatBigIntToUSDFixed(absAmountN)
        )
        // in the event of a race condition, the payload's idempotency key will prevent circle
        // from creating multiple transfers
        walletTransfer = await this.circle.createWalletTransfer(payload)
      } else {
        // If transfer is a deposit, send money to user wallet
        // Otherwise it's withdrawal, send money to merchant wallet
        // If needed, a separate transfer will need to be created for a seller
        const from = isDebit ? merchantWallet.walletId : userWallet.walletId
        const to = isDebit ? userWallet.walletId : merchantWallet.walletId
        // in the event of a race condition, this function may return a pre-existing
        // recorded payload
        const payload = await this.setCircleInternalTransferPayloadIfNecessary(
          userAccountTransferId,
          from,
          to,
          formatBigIntToUSDFixed(absAmountN)
        )
        // in the event of a race condition, the payload's idempotency key will prevent circle
        // from creating multiple transfers
        walletTransfer = await this.circle.createWalletTransfer(payload)
      }
      // See note above about circle methods sometimes returning null and us treating this
      // as a recoverable error
      invariant(walletTransfer, 'Unable to create circle transfer')

      // Under normal conditions, the status will be "pending" and errorCode null, but in the event of a retry
      // if the status resolved to "complete" of "failed" since sending the first req, then circle will return
      // the updated status (and errorCode if necessary) so we make sure to set those properties here
      await UserAccountTransferModel.query().findById(transfer.id).patch({
        externalId: walletTransfer.id,
        status: walletTransfer.status,
        error: walletTransfer.errorCode,
      })
    } catch (error) {
      this.logger.error(error)
      await this.markTransferFailedIfErrorIsUnrecoverableAndNoPayloadExists(
        error,
        userAccountTransferId
      )
      throw error
    }
  }

  async startUpdateTransferStatus(data: UpdateCreditsTransferData) {
    // note: if there's a failure queueing the job then bull MQ retry mechanism should
    // eventually re-invoke this step, but it's still technically possible
    // for a payment to be submitted and for the next job to never be enqueued
    // (so the transfer was submitted but it stays "pending" indefinitely)
    //
    // It's correct to consider these transfers "pending". Eventually, the resolve-pending-transfers
    // job is expected to pick these transfers up and re-submit the appropriate jobs.
    //
    await this.updateCreditsTransferStatusQueue.enqueue(data)
  }

  async updateUserAccountTransferStatus({
    transfer,
  }: UpdateCreditsTransferData) {
    this.logger.info(
      `updating userAccountTransfer with externalId ${transfer.id}`
    )

    try {
      let userAccountTransfer = await UserAccountTransferModel.query().findOne({
        externalId: transfer.id,
      })

      invariant(
        userAccountTransfer,
        `userAccountTransfer for externalId ${transfer.id} not found`,
        UnrecoverableError
      )

      if (this.isTransferInFinalStatus(userAccountTransfer.status)) {
        // status updates unnecessary for non-pending transfers
        return userAccountTransfer
      }
      if (userAccountTransfer.status !== transfer.status) {
        // this patch might end up being called multiple times in race conditions, but
        // it's ok to do multiple patches in this case
        const userAccountTransferQuery = UserAccountTransferModel.query()
          .findById(userAccountTransfer.id)
          .patch({
            status: transfer.status,
            error: transfer.errorCode,
          })
          .returning('*')
          .first()

        userAccountTransfer = await userAccountTransferQuery
      }

      return userAccountTransfer
    } catch (error) {
      // If there's an error here we don't want to mark the transfer failed since we don't know
      // whether it's actually failed or not and we've already submitted it.
      // So, a transfer could be left in a pending state. This function should be retried in that
      // scenario.
      this.logger.error(error)
      throw error
    }
  }

  async createOrGetUserCircleWallet(userId: string) {
    let user = await UserAccountModel.query().findById(userId)
    invariant(user, `user ${userId} not found`)

    let userWallet: CircleWallet
    if (user.externalWalletId) {
      userWallet = await this.circle.getUserWallet(user.externalWalletId)
      // If we were unable to communicate with circle the method above would throw an error
      // (and a retry should eventually occur). If circle returns an explicit error response
      // (401, 404, etc), the method above returns null
      //
      // There may be some cases where it's preferable to not to retry but it's hard to tell.
      // for now we're treating these errors as recoverable
      invariant(userWallet, 'Could not retrieve user wallet data from circle')
    } else {
      // Create new wallet
      let idempotencyKey = uuid()
      await UserAccountModel.query()
        .where({
          id: userId,
          // (avoid race condition)
          circleWalletCreationIdempotencyKey: null,
        })
        .patch({ circleWalletCreationIdempotencyKey: idempotencyKey })
      // fetch the actual key from the database in case a race condition caused the insert to no-op
      user = await UserAccountModel.query().findById(userId)
      idempotencyKey = user.circleWalletCreationIdempotencyKey

      userWallet = await this.circle.createUserWallet({ idempotencyKey })
      // See note above about `null` "createUserWallets" null return value and treating this
      // case as recoverable
      invariant(userWallet, 'unable to create wallet')

      // Associate new wallet with user
      await UserAccountModel.query()
        .where({
          id: userId,
          // (avoid race condition)
          externalWalletId: null,
        })
        .patch({ externalWalletId: userWallet.walletId })
    }

    return userWallet
  }

  async setCircleInternalTransferPayloadIfNecessary(
    userAccountTransferId: string,
    sourceWalletId: string,
    destinationWalletId: string,
    amount: string
  ) {
    let payload: CircleCreateWalletTransferRequest = {
      idempotencyKey: uuid(),
      source: {
        type: CircleTransferSourceType.wallet,
        id: sourceWalletId,
      },
      destination: {
        type: CircleTransferSourceType.wallet,
        id: destinationWalletId,
      },
      amount: {
        currency: CircleTransferCurrencyType.USD,
        amount,
      },
    }

    // write the payload to the transfer row if there's not already one set
    await UserAccountTransferModel.query()
      .where({
        id: userAccountTransferId,
        circleTransferPayload: null,
      })
      .patch({ circleTransferPayload: payload })
    // fetch the actual payload from the database in case the insert was a no-op
    const transfer = await UserAccountTransferModel.query().findById(
      userAccountTransferId
    )
    payload =
      transfer.circleTransferPayload as CircleCreateWalletTransferRequest

    return payload
  }

  async setCirclePayoutTransferPayloadIfNecessary(
    userAccountTransferId: string,
    sourceWalletId: string,
    destinationWalletAddress: string,
    amount: string
  ) {
    let payload: CircleCreateWalletTransferPayoutRequest = {
      idempotencyKey: uuid(),
      source: {
        type: CircleTransferSourceType.wallet,
        id: sourceWalletId,
      },
      destination: {
        address: destinationWalletAddress,
        chain: CircleTransferChainType.ALGO,
        type: CircleTransferDestinationType.blockchain,
      },
      amount: {
        currency: CircleTransferCurrencyType.USD,
        amount,
      },
    }
    // write the payload to the transfer row if there's not already one set
    await UserAccountTransferModel.query()
      .where({
        id: userAccountTransferId,
        circleTransferPayload: null,
      })
      .patch({ circleTransferPayload: payload })
    // fetch the actual payload from the database in case the insert was a no-op
    const transfer = await UserAccountTransferModel.query().findById(
      userAccountTransferId
    )
    payload =
      transfer.circleTransferPayload as CircleCreateWalletTransferPayoutRequest
    return payload
  }

  async retryFailedTransferAndMarkCurrentAsComplete(transfer) {
    // Because we're queuing this new job as the result of a transfer failure, we'd
    // like to utilize a delay (with the same "exponentialThenDaily"/ max attempts) features
    // we get when failed jobs are retried with bull-mq.
    //
    // To achieve this, we count the number of transfers that have failed and then manually
    // call the back-off function that the jobs use. We then manually specify the delay when queuing
    // the job (or neglect to queue it if we've hit the max attempts)
    //
    // Note: if there's a failure queuing the new job or during the insert or delay calculation, then
    // the current job will fail (recoverably) and this code should eventually be retried.

    // note: not particularly worried about race conditions here when calculating the delay
    const failedTransfersAssociatedWithPayment =
      await UserAccountTransferModel.query().where({
        entityType: transfer.entityType,
        entityId: transfer.entityId,
        userAccountId: transfer.userAccountId,
      })

    const attempt = failedTransfersAssociatedWithPayment.length + 1
    if (attempt <= exponentialThenDailyBackoff.recommendedAttempts) {
      const newTransfer = await this.createUserAccountTransfer({
        amount: transfer.amount,
        entityId: transfer.entityId,
        entityType: transfer.entityType,
        userAccountId: transfer.userAccountId,
      })
      const delay = exponentialThenDailyBackoff(attempt)

      // eslint-disable-next-line no-useless-catch
      try {
        await this.startSubmitCreditsTransfer(newTransfer.id, delay)
      } catch (error) {
        // If we catch an exception queuing the job
        // the current transfer has not been marked as complete yet, the current job should eventually retry
        // and this function will run again (and will re-use the pending transfer ID we just created when it tries to queue again)
        throw error
      }
    }

    // mark the failed transfer as complete
    await this.markTransferJobComplete(transfer.id)
  }

  async markTransferJobComplete(transferId: string, trx?: Transaction) {
    const innerTrx = trx ?? (await Model.startTransaction())
    try {
      await UserAccountTransferModel.query()
        .where({ id: transferId })
        .patch({ creditsTransferJobCompletedAt: new Date().toISOString() })

      if (!trx) await innerTrx.commit()
    } catch (error) {
      if (!trx) await innerTrx.rollback()
      throw error
    }
  }
}
