import {
  AlgorandTransactionStatus,
  CollectibleBase,
  NotificationType,
} from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import {
  decodeRawSignedTransaction,
  isTransactionDeadError,
} from '@algomart/shared/algorand'
import {
  AlgorandTransactionModel,
  CollectibleModel,
  CollectibleOwnershipModel,
  PackModel,
  UserAccountModel,
} from '@algomart/shared/models'
import { ClaimPackData } from '@algomart/shared/queues'
import {
  FailedPostgresWriteAssertionError,
  invariant,
} from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import { Model } from 'objection'

import { AccountsService } from '../accounts.service'
import { AlgorandTransactionsService } from '../algorand-transactions.service'
import { CMSCacheService } from '../cms-cache.service'
import { NotificationsService } from '../notifications.service'

export class ClaimPackService {
  constructor(
    private readonly algorand: AlgorandAdapter,
    private readonly cms: CMSCacheService,
    private readonly notifications: NotificationsService,
    private readonly transactions: AlgorandTransactionsService,
    private readonly accounts: AccountsService
  ) {}

  // Funds a users Algorand account with initial funds if it's not already funded
  async ensureAccountMinBalanceForPack({ packId }: ClaimPackData) {
    const pack = await PackModel.query().findById(packId)
    invariant(pack, 'pack not found', UnrecoverableError)
    invariant(pack.ownerId, 'pack not claimed', UnrecoverableError)
    const userId = pack.ownerId
    await this.accounts.ensureAccountMinBalance(userId)
  }

  // Creates assets for each NFT in the pack if necessary
  async mintPackCollectibles({ packId }: ClaimPackData) {
    // Note: the collectibles associated with a pack won't change after they're initially set, so
    // its ok to run this assertion ahead of time here
    let collectibles = await CollectibleModel.query().where('packId', packId)

    invariant(
      collectibles.length <= 16,
      `Cannot mint more than 16 collectibles per pack ${packId}`,
      UnrecoverableError
    )

    invariant(
      collectibles.length > 0,
      `Pack does not have any collectibles ${packId}`,
      UnrecoverableError
    )

    // Collectibles have already been minted, return txn IDs
    if (collectibles.every((c) => !!c.address)) return

    // Mint new assets
    //
    // Important: We may need to create new transactions, or we may be picking up the task from another
    // failed process. Also other processes may be running concurrently which are doing the same work.
    // We need to take care not to overwrite another processes transactions in our database or double-mint
    // the asset.
    //
    // Strategy to avoid double minting is essentially that once we've recorded the signed transactions to create
    // the assets in our database, we never submit new transactions. We only try to re-submit the same ones. (and
    // Algorand will not allow the same transaction to be submitted twice)

    const templateIds = [
      ...new Set(collectibles.map((c) => c.templateId)),
    ] as string[]

    const templates = await this.cms.findCollectiblesByTemplateIds(templateIds)

    invariant(templates.length > 0, 'templates not found', UnrecoverableError)

    // 1.) Create new asa-creation transactions and record in database (if there's not already some there)
    if (!collectibles[0].creationTransactionId) {
      // note: this is called "...IfNecessary" because in the event of a race condition two concurrent
      // workers could evaluate this conditional to true and call the function, but it would correctly no-op in all but
      // one of said processes in that rare event.
      await this.generateCreateAssetTransactionsAndWriteToDbIfNecessary({
        collectibles,
        templates,
      })
    }

    // Refetch the collectibles to read their creation transactions (they might've just been created in step 1)
    collectibles = await CollectibleModel.query()
      .where('packId', packId)
      .withGraphFetched(
        'creationTransaction.group.transactions(orderAscByOrderField)'
      )

    // Each collectible only requires a single algorand transaction to mint (and max is 16 collectibles), so we
    // only need one call to submitAndWaitForTransactionsIfNecessary
    const transactionIds = []
    const signedTransactions = []
    // all of the collectible creation transaction share the same group, so to get the ordered transaction set
    // we only need to look at the first collectible.
    const transactions = collectibles[0].creationTransaction.group.transactions

    for (const transaction of transactions) {
      transactionIds.push(transaction.address)
      signedTransactions.push(
        decodeRawSignedTransaction(transaction.encodedSignedTransaction)
      )
    }

    if (
      collectibles[0].creationTransaction.status !==
      AlgorandTransactionStatus.Confirmed
    ) {
      // this will throw unless all transactions are able to be confirmed and recorded as such
      try {
        await this.transactions.submitAndWaitForTransactionsIfNecessary(
          signedTransactions,
          transactionIds
        )
      } catch (error) {
        // Special case: if a submission failed because the transaction was created too many rounds ago,
        // then it is safe to clear out the recorded transactions so that a retry can re-create them.
        if (isTransactionDeadError(error)) {
          await this.transactions.clearCreationTransactionIdFromCollectibles(
            collectibles
          )
          await this.transactions.deleteTransactionGroup(
            transactions[0].groupId
          )
        }
        throw error
      }
    }

    await this.patchCollectiblesWithCreatedAssetAddressesIfNecessary(
      transactionIds
    )
  }

  // Create/ sign the algorand transactions necessary to create collectible assets
  // and record them for later submission.
  private async generateCreateAssetTransactionsAndWriteToDbIfNecessary({
    collectibles,
    templates,
  }: {
    collectibles: CollectibleModel[]
    templates: CollectibleBase[]
  }) {
    const { signedTransactions, transactionIds } =
      await this.algorand.generateCreateAssetTransactions(
        collectibles,
        templates
      )

    const trx = await Model.startTransaction()
    try {
      const { transactions } = await this.transactions.saveSignedTransactions(
        signedTransactions,
        transactionIds,
        trx
      )

      // update collectibles with their creation transaction reference
      await Promise.all(
        collectibles.map(async (collectible, index) => {
          const transactionId = transactions.find(
            (transaction) => transaction.address === transactionIds[index]
          ).id
          const affectedRows = await CollectibleModel.query(trx)
            .patch({
              creationTransactionId: transactionId,
            })
            .where({
              id: collectible.id,
              // if another process has already set the creationTransactionId then we no-op
              // avoids race conditions
              creationTransactionId: null,
            })

          if (!affectedRows) {
            // if we didn't write any new rows then throw so that we rollback
            throw new FailedPostgresWriteAssertionError()
          }
        })
      )

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      if (!(error instanceof FailedPostgresWriteAssertionError)) {
        // if a write assertion caused the error, then just no-op. Otherwise throw.
        throw error
      }
    }
  }

  // fetch the asset indexes associated with confirmed asset creation transactions
  // and add them to the collectibles they're associated with if they're not already
  // referenced
  private async patchCollectiblesWithCreatedAssetAddressesIfNecessary(
    assetCreationTransactionIds
  ) {
    // these will all be confirmed unless there's a problem fetching the statuses
    // in which case this function will throw
    const statuses = await this.algorand.waitForAllConfirmations(
      assetCreationTransactionIds
    )

    // this just a sanity-check, waitForAllConfirmations will have thrown if there was
    // a problem
    invariant(
      statuses.every((status) => !!status.assetIndex),
      'expected asset index on all txn statuses',
      UnrecoverableError
    )

    invariant(
      statuses.every((status) => !!status.txID),
      'expected txID on all txn statuses',
      UnrecoverableError
    )

    // this might overwrite existing asset indexes in the event of a race condition
    // but it would be overwriting the address with the same exact value so its ok.
    const trx = await Model.startTransaction()
    try {
      await Promise.all(
        statuses.map(async (status) => {
          await CollectibleModel.query(trx)
            .where(
              'creationTransactionId',
              AlgorandTransactionModel.query(trx)
                .select('id')
                .where('address', status.txID)
            )
            .patch({
              address: status.assetIndex,
            })
        })
      )

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  // transfers ASA's associated with a claimed pack to the owners custodial algorand account
  // if they haven't already been transferred
  async transferPack({ packId }: ClaimPackData) {
    const pack = await PackModel.query()
      .where('id', packId)
      .withGraphFetched('collectibles.latestTransferTransaction')
      .modifyGraph('collectibles', (builder) => {
        builder.select(['id', 'ownerId'])
      })
      .first()

    invariant(pack, `pack not found ${packId}`, UnrecoverableError)
    invariant(pack.ownerId, `pack has no owner ${packId}`, UnrecoverableError)

    if (
      pack.collectibles.every(
        (collectible) =>
          collectible.ownerId === pack.ownerId &&
          collectible.latestTransferTransaction?.status ===
            AlgorandTransactionStatus.Confirmed
      )
    ) {
      // if every collectible in the pack is already marked with the correct owner,
      // then the transfer is complete. Skip to next step
      return
    }

    // Transfer assets one at a time
    //
    // Important: We may need to create new transactions, or we may be picking up the task from another
    // failed process. Also other processes may be running concurrently which are doing the same work.
    // We need to take care not to overwrite another processes transactions in our database submit extra
    // algorand transactions
    //
    // Strategy to avoid edge cases is essentially that once we've recorded the signed transactions to transfer
    // the assets in our database, we never submit new transactions. We only try to re-submit the same ones. (and
    // Algorand will not allow the same transaction to be submitted twice)

    const collectibleIds = pack.collectibles.map((c) => c.id)

    await Promise.all(
      collectibleIds.map(async (id) => {
        await this.transferAssetFromCreatorToUserIfNecessary(id, pack.ownerId)
      })
    )
  }

  private async transferAssetFromCreatorToUserIfNecessary(
    collectibleId: string,
    userId: string
  ) {
    let collectible = await CollectibleModel.query()
      .findById(collectibleId)
      .withGraphFetched('latestTransferTransaction')

    const user = await UserAccountModel.query()
      .findById(userId)
      .withGraphFetched('algorandAccount')

    invariant(user, `user account ${userId} not found`, UnrecoverableError)
    invariant(
      collectible,
      `collectible ${collectibleId} not found`,
      UnrecoverableError
    )

    const encryptedMnemonic = user.algorandAccount?.encryptedKey
    invariant(
      encryptedMnemonic,
      'User missing algorand account',
      UnrecoverableError
    )

    const assetIndex = collectible.address
    invariant(assetIndex, 'Collectible not yet minted', UnrecoverableError)

    const { creator } = await this.algorand.getAssetInfo(assetIndex)
    invariant(
      creator,
      `Collectible with asset index ${assetIndex} not found on blockchain`,
      UnrecoverableError
    )

    const userAccountInfo = await this.algorand.getAccountInfo(
      user.algorandAccount.address
    )
    invariant(
      userAccountInfo,
      `User's Algorand account ${user.algorandAccount.address} not found on blockchain`
    )

    invariant(
      !collectible.ownerId || collectible.ownerId === userId,
      'Collectible is not owned by this user',
      UnrecoverableError
    )

    // if the collectible is already marked with the correct owner and the transaction
    // is marked as complete, then there's nothing to do
    if (
      collectible.ownerId === userId &&
      collectible.latestTransferTransaction?.status ===
        AlgorandTransactionStatus.Confirmed
    ) {
      return
    }

    if (!collectible.latestTransferTransaction) {
      // note: this is called "...IfNecessary" because in the event of a race condition two concurrent
      // workers could evaluate this conditional to true and call the function, but it would correctly no-op in all but
      // one of said processes in that rare event.
      await this.generateAssetTransferTransactionsAndWriteToDbIfNecessary({
        assetIndex,
        creator,
        collectibleId,
        encryptedMnemonic,
        userId,
      })
    }

    // Refetch the collectible to read their creation transactions (they might've just been created above)
    collectible = await CollectibleModel.query()
      .findOne('id', collectibleId)
      .withGraphFetched(
        'latestTransferTransaction.group.transactions(orderAscByOrderField)'
      )

    const transactions =
      collectible.latestTransferTransaction.group.transactions

    invariant(
      transactions,
      'Collectible does not have latest transfer transactions',
      UnrecoverableError
    )

    const transactionIds = []
    const signedTransactions = []
    // there's really only one but incase there's more in the future we have this loop
    for (const transaction of transactions) {
      transactionIds.push(transaction.address)
      signedTransactions.push(
        decodeRawSignedTransaction(transaction.encodedSignedTransaction)
      )
    }

    try {
      await this.transactions.submitAndWaitForTransactionsIfNecessary(
        signedTransactions,
        transactionIds
      )
    } catch (error) {
      // Special case: if a submission failed because the transaction was created too many rounds ago,
      // then it is safe to clear out the recorded transactions so that a retry can re-create them.
      if (isTransactionDeadError(error)) {
        await this.transactions.clearLatestTransferTransactionIdFromCollectible(
          collectibleId
        )
        await this.transactions.deleteTransactionGroup(transactions[0].groupId)
      }
      throw error
    }
  }

  private async generateAssetTransferTransactionsAndWriteToDbIfNecessary({
    assetIndex,
    collectibleId,
    creator,
    encryptedMnemonic,
    userId,
  }: {
    assetIndex: number
    creator: string
    collectibleId: string
    encryptedMnemonic: string
    userId: string
  }) {
    const { signedTransactions, transactionIds } =
      await this.algorand.generateClawbackTransactions({
        assetIndex,
        encryptedMnemonic,
        // NOTE: Unless this is an older collectible, the creator account will
        //       be the same as the funding account. Either way, we need to pass
        //       the creator in here to ensure the clawback transaction is
        //       transferring from the correct account.
        fromAccountAddress: creator,
      })

    const trx = await Model.startTransaction()
    try {
      const { transactions } = await this.transactions.saveSignedTransactions(
        signedTransactions,
        transactionIds,
        trx
      )

      const affectedRows = await CollectibleModel.query(trx)
        .where({ id: collectibleId, latestTransferTransactionId: null })
        .patch({
          ownerId: userId,
          latestTransferTransactionId: transactions[0].id,
          claimedAt: new Date().toISOString(),
        })

      if (!affectedRows) {
        // if we didn't write any new rows then throw so that we rollback
        // this would happen if another process just set the owner already using a different transaction
        throw new FailedPostgresWriteAssertionError()
      }

      // const ownership = await CollectibleOwnershipModel.query(trx).insert({
      await CollectibleOwnershipModel.query(trx).insert({
        collectibleId: collectibleId,
        ownerId: userId,
      })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      if (!(error instanceof FailedPostgresWriteAssertionError)) {
        // if a write assertion caused the error, then just no-op. Otherwise throw.
        throw error
      }
    }
  }

  async notifyPackOwner({ packId }: ClaimPackData) {
    const pack = await PackModel.query().findById(packId)
    const user = await UserAccountModel.query().findById(pack.ownerId)
    const packWithBase = await this.cms.findPackByTemplateId(
      pack.templateId,
      user.language
    )
    await this.notifications.createNotification({
      type: NotificationType.TransferSuccess,
      userAccountId: pack.ownerId,
      variables: {
        packTitle: packWithBase.title,
      },
    })
  }
}
