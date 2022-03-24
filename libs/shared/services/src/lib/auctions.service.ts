import {
  AlgorandTransactionStatus,
  CollectibleAuctionStatus,
  CreateAuctionBody,
  EventAction,
  EventEntityType,
} from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import {
  CollectibleAuctionModel,
  CollectibleModel,
  EventModel,
  UserAccountModel,
} from '@algomart/shared/models'
import { invariant, userInvariant } from '@algomart/shared/utils'
import algosdk from 'algosdk'
import fs from 'node:fs/promises'
import path from 'node:path'
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
  ) {
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
      (asset) => asset.assetId === collectible.address
    )
    userInvariant(
      asset,
      `Asset ${collectible.address} not owned by ${user.algorandAccount.address}`,
      400
    )

    this.logger.info(
      `Creating auction for ${user.algorandAccount.address} with NFT ${asset.assetId}...`
    )

    const approvalProgramBytes = await this.algorand.compileContract(
      await fs.readFile(
        path.join(__dirname, 'contracts', 'auction_approval.teal'),
        'utf8'
      )
    )

    const clearStateProgramBytes = await this.algorand.compileContract(
      await fs.readFile(
        path.join(__dirname, 'contracts', 'auction_clear_state.teal'),
        'utf8'
      )
    )

    // Contract requires 2 global byte slices (strings) and 8 global uints
    const numberGlobalByteSlices = 2
    const numberGlobalInts = 8

    // Set min bid increase to 1% of reserve price
    const minBidPriceIncrease = Math.floor(request.reservePrice / 100)

    // Start auction in five minutes
    const startAt = Math.floor(Date.now() / 1000) + 5 * 60
    const startAtDate = new Date(startAt * 1000)
    const endAt =
      Math.floor(Date.now() / 1000) + request.durationInHours * 60 * 60
    const endAtDate = new Date(endAt * 1000)
    userInvariant(
      startAt < endAt,
      'Auction end time must be after start time',
      400
    )

    const { transaction, signedTransaction } =
      await this.algorand.createApplicationTransaction({
        appArgs: [
          algosdk.decodeAddress(user.algorandAccount.address).publicKey,
          algosdk.encodeUint64(collectible.address),
          algosdk.encodeUint64(startAt),
          algosdk.encodeUint64(endAt),
          algosdk.encodeUint64(request.reservePrice),
          algosdk.encodeUint64(minBidPriceIncrease),
          algosdk.encodeUint64(Math.round(feePercentage)),
        ],
        approvalProgram: approvalProgramBytes,
        clearProgram: clearStateProgramBytes,
        numGlobalByteSlices: numberGlobalByteSlices,
        numGlobalInts: numberGlobalInts,
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
      startAt: startAtDate,
      endAtDate: endAtDate,
    }
  }

  async setupAuction(trx?: Transaction) {
    throw new Error('Not yet implemented')
    // TODO: call setup method on the auction
    // Requires:
    // - auction's id so the right auction can be found
    // - user's passphrase to sign asset transfer transaction (transferring to escrow account)
    // - auction.appId to be set (this should be set by the transaction background task)
    // - funding account funds to cover escrow account min balance (204,000 microAlgos)
    // - funding account min balance will be increased by around 1 ALGO
    // - must be called before the auction's start time
  }
}
