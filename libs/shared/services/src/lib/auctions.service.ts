import pino from 'pino'
import { CreateAuctionBody } from '@algomart/schemas'
import algosdk from 'algosdk'
import fs from 'node:fs/promises'
import path from 'node:path'

import { userInvariant, decrypt } from '@algomart/shared/utils'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import { CollectibleModel, UserAccountModel } from '@algomart/shared/models'
import { Knex } from 'knex'

export default class AuctionsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly algorand: AlgorandAdapter,
    private readonly appSecret: string,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async createAuction(request: CreateAuctionBody, knexRead?: Knex) {
    const user = await UserAccountModel.query(knexRead)
      .where({
        externalId: request.externalId,
      })
      .withGraphJoined('algorandAccount')
      .first()
    userInvariant(user, 'User not found', 404)
    const mnemonic = decrypt(
      user.algorandAccount?.encryptedKey,
      request.passphrase,
      this.appSecret
    )
    userInvariant(mnemonic, 'Invalid passphrase', 400)

    const collectible = await CollectibleModel.query(knexRead)
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
