import { CollectibleBase } from '@algomart/schemas'
import algosdk from 'algosdk'

import { Configuration } from '@/configuration'
import { CollectibleModel } from '@/models/collectible.model'
import { decrypt, encrypt } from '@/utils/encryption'
import { invariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

// 100_000 microAlgos = 0.1 ALGO
export const DEFAULT_INITIAL_BALANCE = 100_000

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

export interface AccountInfo {
  address: string
  amount: number
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
    this.logger.info('Using funding account %s', this.fundingAccount.addr)

    this.testConnection()
  }

  async testConnection() {
    try {
      const status = await this.algod.status().do()
      this.logger.info({ status }, 'Successfully connected to Algod')
    } catch (error) {
      this.logger.error(error, 'Failed to connect to Algod')
    }
  }

  generateAccount(passphrase: string): PublicAccount {
    const account = algosdk.generateAccount()
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk)
    const encryptedMnemonic = encrypt(mnemonic, passphrase)
    return {
      address: account.addr,
      encryptedMnemonic,
      signedTransactions: [],
      transactionIds: [],
    }
  }

  async createAccount(
    passphrase: string,
    initialBalance = DEFAULT_INITIAL_BALANCE
  ): Promise<PublicAccount> {
    const account = algosdk.generateAccount()
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk)
    const encryptedMnemonic = encrypt(mnemonic, passphrase)

    const { signedTransactions, transactionIds } =
      await this.initialFundTransactions(
        encryptedMnemonic,
        passphrase,
        initialBalance
      )

    return {
      address: account.addr,
      encryptedMnemonic,
      transactionIds,
      signedTransactions,
    }
  }

  async initialFundTransactions(
    encryptedMnemonic: string,
    passphrase: string,
    initialBalance = DEFAULT_INITIAL_BALANCE
  ) {
    const account = algosdk.mnemonicToSecretKey(
      decrypt(encryptedMnemonic, passphrase)
    )

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

    return {
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

  async getAccountInfo(account: string): Promise<AccountInfo> {
    const info = await this.algod.accountInformation(account).do()
    return {
      address: info.address,
      amount: info.amount,
    }
  }

  async getCreatorAccount(initialBalance: number) {
    const fundingAccountInfo = await this.getAccountInfo(
      this.fundingAccount.addr
    )

    invariant(
      fundingAccountInfo.amount > initialBalance + 100_000,
      `Not enough funds on account ${fundingAccountInfo.address}. Have ${
        fundingAccountInfo.amount
      } microAlgos, need ${initialBalance + 100_000} microAlgos.`
    )

    const creator = await this.createAccount(
      Configuration.creatorPassphrase,
      initialBalance
    )

    await this.submitTransaction(creator.signedTransactions)

    // Just need to wait for the funding transaction to complete
    await this.waitForConfirmation(creator.transactionIds[0])

    return creator
  }

  async generateCreateAssetTransactions(
    collectibles: CollectibleModel[],
    templates: CollectibleBase[],
    creator?: PublicAccount
  ) {
    const suggestedParams = await this.algod.getTransactionParams().do()
    const templateLookup = new Map(templates.map((t) => [t.templateId, t]))
    let fromAccount = this.fundingAccount

    if (creator) {
      fromAccount = algosdk.mnemonicToSecretKey(
        decrypt(creator.encryptedMnemonic, Configuration.creatorPassphrase)
      )
    }

    const transactions = collectibles.map((collectible) => {
      const template = templateLookup.get(collectible.templateId)
      if (!template) {
        throw new Error(`Missing template ${collectible.templateId}`)
      }

      /**
       * These ASA parameters should follow the following conventions to meet ARC3 compliance
       * https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md#asa-parameters-conventions
       */
      return algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        assetName: `${template.uniqueCode} ${collectible.edition}/${template.totalEditions}`,
        assetURL: `${collectible.assetUrl}#arc3`,
        assetMetadataHash: new Uint8Array(
          Buffer.from(collectible.assetMetadataHash, 'hex')
        ),
        from: fromAccount.addr,
        total: 1,
        decimals: 0,
        defaultFrozen: false,
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

    // Use a clawback to "revoke" ownership from current owner to the buyer.
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
