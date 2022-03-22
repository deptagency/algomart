import { CreateAuctionBody } from '@algomart/schemas'
import { decrypt, userInvariant } from '@algomart/shared/utils'
import { Configuration } from '@api/configuration'
import { logger } from '@api/configuration/logger'
import AlgorandAdapter from '@api/lib/algorand-adapter'
import { CollectibleModel } from '@api/models/collectible.model'
import { UserAccountModel } from '@api/models/user-account.model'
import algosdk from 'algosdk'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Transaction } from 'objection'

export default class AuctionsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly algorand: AlgorandAdapter) {}

  async createAuction(request: CreateAuctionBody, trx?: Transaction) {
    const user = await UserAccountModel.query(trx)
      .where({
        externalId: request.externalId,
      })
      .withGraphJoined('algorandAccount')
      .first()
    userInvariant(user, 'User not found', 404)
    const mnemonic = decrypt(
      user.algorandAccount?.encryptedKey,
      request.passphrase,
      Configuration.secret // TODO: receive via argument
    )
    userInvariant(mnemonic, 'Invalid passphrase', 400)

    const collectible = await CollectibleModel.query(trx)
      .where({
        id: request.collectibleId,
        ownerId: user.id,
      })
      .first()
    userInvariant(collectible, 'Collectible not found', 404)

    this.logger.info({
      collectible,
      user,
    })

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

    const txnFee = 1000
    const numberGlobalByteSlices = 2
    const numberGlobalInts = 7
    const accountInfo = await this.algorand.getAccountInfo(
      user.algorandAccount?.address
    )
    const minBalance =
      txnFee +
      this.algorand.getAccountMinBalance(accountInfo) +
      this.algorand.appMinBalance({
        numGlobalByteSlices: numberGlobalByteSlices,
        numGlobalInts: numberGlobalInts,
      }).create

    userInvariant(
      accountInfo.amount >= minBalance,
      `Insufficient balance, need ${minBalance}, has ${accountInfo.amount}`,
      400
    )

    const txn = await this.algorand.createApplicationTransaction({
      appArgs: [
        algosdk.decodeAddress(user.algorandAccount?.address).publicKey,
        algosdk.encodeUint64(collectible.address),
        algosdk.encodeUint64(
          Math.floor(new Date(request.startAt).getTime() / 1000)
        ),
        algosdk.encodeUint64(
          Math.floor(new Date(request.endAt).getTime() / 1000)
        ),
        algosdk.encodeUint64(request.reservePrice),
      ],
      approvalProgram: approvalProgramBytes,
      clearProgram: clearStateProgramBytes,
      numGlobalByteSlices: numberGlobalByteSlices,
      numGlobalInts: numberGlobalInts,
    })

    this.logger.info({ txn }, 'transaction')

    // TODO: submit transaction and then fund the app (escrow account) somehow?
  }
}
