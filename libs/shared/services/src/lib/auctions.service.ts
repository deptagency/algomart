import {
  AlgorandTransactionStatus,
  CollectibleAuctionStatus,
  CreateAuctionBody,
  CreateAuctionResponse,
  EventAction,
  EventEntityType,
  SetupAuctionBody,
  SetupAuctionResponse,
} from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import {
  AlgorandTransactionGroupModel,
  AlgorandTransactionModel,
  CollectibleAuctionModel,
  CollectibleModel,
  EventModel,
  UserAccountModel,
} from '@algomart/shared/models'
import { invariant, userInvariant } from '@algomart/shared/utils'
import { Transaction } from 'objection'
import pino from 'pino'

export class AuctionsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly algorand: AlgorandAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async createAuction(
    request: CreateAuctionBody,
    feePercentage: number,
    trx?: Transaction
  ): Promise<CreateAuctionResponse> {
    invariant(
      feePercentage >= 0,
      'feePercentage must be greater than or equal to 0'
    )
    invariant(
      feePercentage <= 100,
      'feePercentage must be less than or equal to 100'
    )

    const user = await UserAccountModel.query(trx)
      .where({
        externalId: request.externalId,
      })
      .withGraphJoined('algorandAccount')
      .first()
    userInvariant(user, 'User not found', 404)
    invariant(user.algorandAccount, `User ${user.id} has no Algorand account`)

    const collectible = await CollectibleModel.query(trx)
      .where('id', request.collectibleId)
      .whereNotNull('address')
      .first()
    userInvariant(collectible, 'Collectible not found', 404)

    const accountInfo = await this.algorand.getAccountInfo(
      user.algorandAccount.address
    )
    invariant(
      accountInfo,
      `Algorand account info not found for ${user.algorandAccount.address}`
    )
    const asset = accountInfo.assets.find(
      (asset) => asset.assetId === collectible.address && asset.amount > 0
    )
    // TODO: could improve this experience a bit and return the already created auction details, if one exists
    userInvariant(
      asset,
      `Asset ${collectible.address} not owned by ${user.algorandAccount.address}, auction may already be active`,
      400
    )

    this.logger.info(
      `Creating auction for ${user.algorandAccount.address} with NFT ${asset.assetId}...`
    )

    // Set min bid increase to 1% of reserve price
    const minBidPriceIncrease = Math.floor(request.reservePrice / 100)

    // Start auction in five minutes
    const startAtDate = new Date(Date.now() + 5 * 60 * 1000)
    const endAtDate = new Date(
      startAtDate.getTime() + request.durationInHours * 60 * 60 * 1000
    )
    userInvariant(
      startAtDate < endAtDate,
      'Auction end time must be after start time',
      400
    )

    const { transaction, signedTransaction } =
      await this.algorand.generateCreateAuctionTransactions({
        assetId: asset.assetId,
        endAt: endAtDate,
        feePercentage,
        reservePrice: request.reservePrice,
        sellerAddress: user.algorandAccount.address,
        startAt: startAtDate,
        minBidPriceIncrease,
      })

    await this.algorand.submitTransaction(signedTransaction)

    const auction = await CollectibleAuctionModel.query(trx).insertGraph({
      appId: null,
      collectibleId: collectible.id,
      endAt: endAtDate.toISOString(),
      startAt: startAtDate.toISOString(),
      reservePrice: request.reservePrice,
      status: CollectibleAuctionStatus.New,
      transaction: {
        address: transaction.txID(),
        status: AlgorandTransactionStatus.Pending,
      },
      userAccountId: user.id,
    })

    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityId: auction.id,
      entityType: EventEntityType.CollectibleAuction,
      userAccountId: user.id,
    })

    return {
      auctionId: auction.id,
      collectibleId: collectible.id,
      status: auction.status,
      startAt: startAtDate.toISOString(),
      endAt: endAtDate.toISOString(),
      transactionId: transaction.txID(),
    }
  }

  async setupAuction(
    request: SetupAuctionBody,
    trx?: Transaction
  ): Promise<SetupAuctionResponse> {
    const auction = await CollectibleAuctionModel.query(trx)
      .findById(request.auctionId)
      .withGraphFetched('collectible')

    const user = await UserAccountModel.query(trx)
      .findOne('externalId', request.externalId)
      .withGraphJoined('algorandAccount')

    userInvariant(user, 'User not found', 404)
    invariant(user.algorandAccount, `User ${user.id} has no Algorand account`)
    userInvariant(auction, 'Auction not found', 404)
    invariant(auction.collectible, 'Auction has no collectible')
    userInvariant(
      auction.status === CollectibleAuctionStatus.Created,
      `Auction status must be ${CollectibleAuctionStatus.Created} but is ${auction.status}`,
      400
    )
    userInvariant(
      new Date() < new Date(auction.startAt),
      'Auction has already started',
      400
    )
    userInvariant(auction.appId, 'Auction has no appId', 400)
    userInvariant(
      auction.userAccountId === user.id,
      'Auction not owned by user',
      400
    )

    const { transactions, signedTransactions } =
      await this.algorand.generateSetupAuctionTransactions({
        appId: auction.appId,
        sellerEncryptedMnemonic: user.algorandAccount.encryptedKey,
        sellerPassphrase: request.passphrase,
        assetId: auction.collectible.address,
      })

    await this.algorand.submitTransaction(signedTransactions)

    const group = await AlgorandTransactionGroupModel.query(trx).insert({})

    const savedTransactions = await AlgorandTransactionModel.query(trx).insert(
      transactions.map((transaction) => ({
        address: transaction.txID(),
        status: AlgorandTransactionStatus.Pending,
        groupId: group.id,
      }))
    )

    await EventModel.query(trx).insert(
      savedTransactions.map((transaction) => ({
        action: EventAction.Create,
        entityId: transaction.id,
        entityType: EventEntityType.AlgorandTransaction,
        userAccountId: user.id,
      }))
    )

    await CollectibleAuctionModel.query(trx).where('id', auction.id).patch({
      status: CollectibleAuctionStatus.SettingUp,
      // the second transaction is the app call one that we need to track
      setupTransactionId: savedTransactions[1].id,
    })

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityId: auction.id,
      entityType: EventEntityType.CollectibleAuction,
      userAccountId: user.id,
    })

    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityId: group.id,
      entityType: EventEntityType.AlgorandTransactionGroup,
      userAccountId: user.id,
    })

    return {
      auctionId: auction.id,
      status: auction.status,
      transactionIds: transactions.map((transaction) => transaction.txID()),
    }
  }
}
