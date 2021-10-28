import { CollectibleBase } from '@algomart/schemas'
import algosdk from 'algosdk'

import { Configuration } from '@/configuration'
import { CollectibleModel } from '@/models/collectible.model'
import { decrypt, encrypt } from '@/utils/encryption'
import { logger } from '@/utils/logger'

// 100_000 microAlgos = 0.1 ALGO
const DEFAULT_INITIAL_BALANCE = 100_000

export interface PublicAccount {
  address: string
  encryptedMnemonic: string
  transactionIds: string[]
  signedTransactions: Uint8Array[]
}

export interface AlgorandAdapterOptions {
  algodToken: string
  algodServer: string
  algodPort: number
  fundingMnemonic: string
}

export default class AlgorandAdapter {
  logger = logger.child({ context: this.constructor.name })
  fundingAccount: algosdk.Account
  algod: algosdk.Algodv2

  constructor(options: AlgorandAdapterOptions) {
    this.algod = new algosdk.Algodv2(
      { 'X-Algo-API-Token': options.algodToken },
      options.algodServer,
      options.algodPort
    )

    this.fundingAccount = algosdk.mnemonicToSecretKey(options.fundingMnemonic)
  }

  async createAccount(
    passphrase: string,
    initialBalance = DEFAULT_INITIAL_BALANCE
  ): Promise<PublicAccount> {
    const account = algosdk.generateAccount()

    const fundingTransaction =
      algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        // initial balance plus non-participation transaction fee
        amount: initialBalance + 1000,
        from: this.fundingAccount.addr,
        suggestedParams: await this.algod.getTransactionParams().do(),
        to: account.addr,
        closeRemainderTo: undefined,
        note: undefined,
        rekeyTo: undefined,
      })

    const nonParticipationTransaction =
      algosdk.makeKeyRegistrationTxnWithSuggestedParamsFromObject({
        suggestedParams: await this.algod.getTransactionParams().do(),
        from: account.addr,
        // this opts the account out of staking rewards
        nonParticipation: true,
      })

    const transactions = [fundingTransaction, nonParticipationTransaction]
    algosdk.assignGroupID(transactions)

    const transactionIds = transactions.map((transaction) => transaction.txID())

    const signedTransactions = [
      fundingTransaction.signTxn(this.fundingAccount.sk),
      nonParticipationTransaction.signTxn(account.sk),
    ]

    const mnemonic = algosdk.secretKeyToMnemonic(account.sk)
    const encryptedMnemonic = encrypt(mnemonic, passphrase)

    return {
      address: account.addr,
      encryptedMnemonic,
      transactionIds,
      signedTransactions,
    }
  }

  async submitTransaction(transaction: Uint8Array | Uint8Array[]) {
    try {
      await this.algod.sendRawTransaction(transaction).do()
    } catch (error) {
      this.logger.error(error as Error)
      throw error
    }
  }

  async getAssetInfo(assetIndex: number) {
    const info = await this.algod
      .getAssetByID(assetIndex)
      .do()
      .catch(() => null)

    if (!info) {
      return null
    }

    /*
    {
      "index": 269,
      "params": {
        "clawback": "GJM6OZHTWHSHBOQPBQNXDSMXLPUPTUE6VYRBTO24CEHWRQ2JX3NYCAHMI4",
        "creator": "ADFI6NIG7FXBHSCSHHMHZIEFVKGPEDQ2QIL35TJZD3PGYAZBYZBOMDCX4E",
        "decimals": 0,
        "default-frozen": true,
        "freeze": "GJM6OZHTWHSHBOQPBQNXDSMXLPUPTUE6VYRBTO24CEHWRQ2JX3NYCAHMI4",
        "manager": "GJM6OZHTWHSHBOQPBQNXDSMXLPUPTUE6VYRBTO24CEHWRQ2JX3NYCAHMI4",
        "name": "asset26 2/5",
        "name-b64": "YXNzZXQyNiAyLzU=",
        "reserve": "GJM6OZHTWHSHBOQPBQNXDSMXLPUPTUE6VYRBTO24CEHWRQ2JX3NYCAHMI4",
        "total": 1,
        "unit-name": "asset26",
        "unit-name-b64": "YXNzZXQyNg==",
        "url": "4ecb78d3-cd2e-4272-a6cb-9dedf9a86ed8",
        "url-b64": "NGVjYjc4ZDMtY2QyZS00MjcyLWE2Y2ItOWRlZGY5YTg2ZWQ4"
      }
    }
    */

    return {
      address: info.index as number,
      creator: info.params.creator as string,
      unitName: info.params['unit-name'] as string,
      url: info.params.url as string,
    }
  }

  async getTransactionStatus(transactionId: string) {
    const info = await this.algod
      .pendingTransactionInformation(transactionId)
      .do()
    const confirmedRound: number = info['confirmed-round'] || 0
    const poolError: string = info['pool-error'] || ''
    const assetIndex: number = info['asset-index'] || 0
    return { confirmedRound, poolError, assetIndex }
  }

  async waitForConfirmation(transactionId: string, maxRounds = 5) {
    let firstRound: number | null = null
    let lastRound: number | null = null
    let elapsed: number | null = null

    while (!elapsed || elapsed <= maxRounds) {
      const lastRoundAfterCall: Record<string, unknown> = lastRound
        ? await this.algod.statusAfterBlock(lastRound).do()
        : await this.algod.status().do()

      lastRound = lastRoundAfterCall['last-round'] as number
      firstRound = firstRound || lastRound

      const status = await this.getTransactionStatus(transactionId)

      if (status.confirmedRound || status.poolError) {
        return status
      }

      elapsed = lastRound - firstRound + 1
    }

    throw new Error(
      `Too many rounds elapsed when waiting for confirmation: ${transactionId}`
    )
  }

  isValidPassphrase(encryptedMnemonic: string, passphrase: string) {
    try {
      const mnemonic = decrypt(encryptedMnemonic, passphrase)
      if (mnemonic) {
        algosdk.mnemonicToSecretKey(mnemonic)
        return true
      }

      return false
    } catch {
      // ignore error, passphrase is invalid
      return false
    }
  }

  async closeCreatorAccount(creator: PublicAccount) {
    const account = algosdk.mnemonicToSecretKey(
      decrypt(creator.encryptedMnemonic, Configuration.creatorPassphrase)
    )
    const suggestedParams = await this.algod.getTransactionParams().do()
    const transaction = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account.addr,
      to: this.fundingAccount.addr,
      suggestedParams,
      closeRemainderTo: this.fundingAccount.addr,
    })
    const signedTransaction = transaction.signTxn(account.sk)
    await this.submitTransaction(signedTransaction)
    await this.waitForConfirmation(transaction.txID())
  }

  async generateCreateAssetTransactions(
    collectibles: CollectibleModel[],
    templates: CollectibleBase[],
    useCreatorAccount?: boolean
  ) {
    const suggestedParams = await this.algod.getTransactionParams().do()
    const templateLookup = new Map(templates.map((t) => [t.templateId, t]))
    let fromAccount = this.fundingAccount
    let creator: PublicAccount | undefined

    if (useCreatorAccount) {
      const initialBalance =
        DEFAULT_INITIAL_BALANCE +
        // 0.1 ALGO per collectible
        collectibles.length * 100_000 +
        // 1000 microAlgos per create transaction
        collectibles.length * 1000

      creator = await this.createAccount(
        Configuration.creatorPassphrase,
        initialBalance
      )
      await this.submitTransaction(creator.signedTransactions)
      // Just need to wait for the funding transaction to complete
      await this.waitForConfirmation(creator.transactionIds[0])
      fromAccount = algosdk.mnemonicToSecretKey(
        decrypt(creator.encryptedMnemonic, Configuration.creatorPassphrase)
      )
    }

    const transactions = collectibles.map((collectible) => {
      const template = templateLookup.get(collectible.templateId)
      if (!template) {
        throw new Error(`Missing template ${collectible.templateId}`)
      }

      return algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        assetName: `${template.uniqueCode} ${collectible.edition}/${template.totalEditions}`,
        // TODO: fix url
        assetURL: template.image,
        from: fromAccount.addr,
        total: 1,
        decimals: 0,
        defaultFrozen: true,
        clawback: this.fundingAccount.addr,
        freeze: this.fundingAccount.addr,
        manager: this.fundingAccount.addr,
        reserve: this.fundingAccount.addr,
        unitName: template.uniqueCode,
        suggestedParams,
      })
    })

    algosdk.assignGroupID(transactions)

    const signedTransactions = transactions.map((transaction) =>
      transaction.signTxn(fromAccount.sk)
    )

    const transactionIds = transactions.map((transaction) => transaction.txID())

    return {
      signedTransactions,
      transactionIds,
      creator,
    }
  }

  async generateClawbackTransactions(options: {
    assetIndex: number
    encryptedMnemonic: string
    passphrase: string
    fromAccountAddress?: string
  }) {
    const toAccount = algosdk.mnemonicToSecretKey(
      decrypt(options.encryptedMnemonic, options.passphrase)
    )

    const suggestedParams = await this.algod.getTransactionParams().do()

    // Send enough money to buyer to cover the "opt-in" transaction and the minimum balance increase
    const fundsTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams,
      amount:
        100_000 /* minimum balance increase */ + 1000 /* opt-in txn fee */,
      from: this.fundingAccount.addr, // System account acting as the global "funding account"
      to: toAccount.addr,
    })

    // Buyer needs to "opt-in" to the asset by using a "zero-balance" transaction
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      suggestedParams,
      amount: 0,
      assetIndex: options.assetIndex,
      from: toAccount.addr,
      to: toAccount.addr,
    })

    // To avoid unfreezing accounts, transferring asset traditionally, and re-freezing the accounts
    // for the asset, just use a clawback to "revoke" ownership from current owner to the buyer.
    const clawbackTxn =
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        suggestedParams,
        amount: 1,
        assetIndex: options.assetIndex,
        from: this.fundingAccount.addr, // Who is issuing the transaction
        to: toAccount.addr,
        revocationTarget:
          options.fromAccountAddress || this.fundingAccount.addr, // Who the asset is being revoked from
      })

    // Adds a group id to each transaction object
    algosdk.assignGroupID([fundsTxn, optInTxn, clawbackTxn])

    const signedTransactions = [
      fundsTxn.signTxn(this.fundingAccount.sk),
      optInTxn.signTxn(toAccount.sk),
      clawbackTxn.signTxn(this.fundingAccount.sk),
    ]

    return {
      transactionIds: [fundsTxn.txID(), optInTxn.txID(), clawbackTxn.txID()],
      signedTransactions,
    }
  }
}
