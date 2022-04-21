import { CollectibleBase, TransferCollectibleResult } from '@algomart/schemas'
import {
  AccountInfo,
  accountInformation,
  calculateAppMinBalance,
  configureSignTxns,
  createClawbackNFTTransactions,
  createConfigureCustodialAccountTransactions,
  createDeployContractTransactions,
  createNewNFTsTransactions,
  decryptAccount,
  encryptAccount,
  generateAccount,
  makeStateConfig,
  NewNFT,
  pendingTransactionInformation,
  waitForConfirmation,
} from '@algomart/shared/algorand'
import { CollectibleModel } from '@algomart/shared/models'
import algosdk from 'algosdk'
import pino from 'pino'

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
  appSecret: string
}

export class AlgorandAdapter {
  logger: pino.Logger<unknown>
  fundingAccount: algosdk.Account
  algod: algosdk.Algodv2

  constructor(
    private options: AlgorandAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
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

  async generateAccount(passphrase: string): Promise<PublicAccount> {
    const account = await generateAccount()
    const encryptedMnemonic = await encryptAccount(
      account,
      passphrase,
      this.options.appSecret
    )
    return {
      address: account.addr,
      encryptedMnemonic,
      signedTransactions: [],
      transactionIds: [],
    }
  }

  async initialFundTransactions(
    encryptedMnemonic: string,
    passphrase: string,
    initialBalance = DEFAULT_INITIAL_BALANCE
  ) {
    const custodialAccount = await decryptAccount(
      encryptedMnemonic,
      passphrase,
      this.options.appSecret
    )

    const result = await createConfigureCustodialAccountTransactions({
      algod: this.algod,
      custodialAccount,
      fundingAccount: this.fundingAccount,
      initialFunds: initialBalance,
    })

    return {
      transactionIds: result.txIDs,
      signedTransactions: result.signedTxns,
    }
  }

  /**
   * Submits one or more transactions to the network. Should only be used in a background task.
   * @param transaction The transaction(s) to be submitted
   * @returns The submitted transaction ID
   */
  async submitTransaction(transaction: Uint8Array | Uint8Array[]) {
    try {
      return await this.algod.sendRawTransaction(transaction).do()
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
      isFrozen: info['is-frozen'] as boolean,
      defaultFrozen: info.params['default-frozen'] as boolean,
      url: info.params.url as string,
    }
  }

  async getTransactionStatus(transactionId: string) {
    return pendingTransactionInformation(this.algod, transactionId)
  }

  async waitForConfirmation(transactionId: string, maxRounds = 5) {
    return waitForConfirmation(this.algod, transactionId, maxRounds)
  }

  async isValidPassphrase(
    encryptedMnemonic: string,
    passphrase: string
  ): Promise<boolean> {
    try {
      await decryptAccount(
        encryptedMnemonic,
        passphrase,
        this.options.appSecret
      )
      // If we get here, the passphrase is valid
      return true
    } catch {
      // ignore error, passphrase is invalid
      return false
    }
  }

  async getAccountInfo(account: string): Promise<AccountInfo> {
    return accountInformation(this.algod, account)
  }

  async generateCreateAssetTransactions(
    collectibles: CollectibleModel[],
    templates: CollectibleBase[]
  ) {
    const templateLookup = new Map(templates.map((t) => [t.templateId, t]))
    const nfts: NewNFT[] = collectibles.map((collectible) => {
      const template = templateLookup.get(collectible.templateId)
      if (!template) {
        throw new Error(`Missing template ${collectible.templateId}`)
      }

      return {
        assetName: `${template.uniqueCode} ${collectible.edition}/${template.totalEditions}`,
        assetURL: `${collectible.assetUrl}#arc3`,
        assetMetadataHash: new Uint8Array(
          Buffer.from(collectible.assetMetadataHash, 'hex')
        ),
        edition: collectible.edition,
        totalEditions: template.totalEditions,
        unitName: template.uniqueCode,
      }
    })

    const result = await createNewNFTsTransactions({
      algod: this.algod,
      creatorAccount: this.fundingAccount,
      nfts,
    })

    return {
      signedTransactions: result.signedTxns,
      transactionIds: result.txIDs,
    }
  }

  async generateClawbackTransactions(options: {
    assetIndex: number
    encryptedMnemonic: string
    passphrase: string
    fromAccountAddress?: string
  }) {
    const toAccount = await decryptAccount(
      options.encryptedMnemonic,
      options.passphrase,
      this.options.appSecret
    )

    const result = await createClawbackNFTTransactions({
      algod: this.algod,
      assetIndex: options.assetIndex,
      clawbackAccount: this.fundingAccount,
      currentOwnerAddress:
        options.fromAccountAddress || this.fundingAccount.addr,
      recipientAddress: toAccount.addr,
      fundingAccount: this.fundingAccount,
      recipientAccount: toAccount,
    })

    return {
      transactionIds: result.txIDs,
      signedTransactions: result.signedTxns,
    }
  }

  async generateClawbackTransactionsFromUser(options: {
    assetIndex: number
    fromAccountAddress: string
    toAccountAddress: string
  }) {
    const result = await createClawbackNFTTransactions({
      algod: this.algod,
      assetIndex: options.assetIndex,
      clawbackAccount: this.fundingAccount,
      currentOwnerAddress: options.fromAccountAddress,
      recipientAddress: options.toAccountAddress,
      skipOptIn: true,
    })

    return {
      transactionIds: result.txIDs,
      signedTransactions: result.signedTxns,
    }
  }

  async createApplicationTransaction(options: {
    approvalProgram: string
    clearProgram: string
    appArgs: Uint8Array[]
    extraPages?: number
    numGlobalByteSlices?: number
    numGlobalInts?: number
    numLocalByteSlices?: number
    numLocalInts?: number
    accounts?: string[]
    foreignApps?: number[]
    foreignAssets?: number[]
    lease?: Uint8Array
  }) {
    const result = await createDeployContractTransactions({
      algod: this.algod,
      approvalSource: options.approvalProgram,
      clearSource: options.clearProgram,
      contractName: 'unknown',
      creatorAccount: this.fundingAccount,
      globalState: makeStateConfig(
        options.numGlobalInts,
        options.numGlobalByteSlices
      ),
      localState: makeStateConfig(
        options.numLocalInts,
        options.numLocalByteSlices
      ),
      accounts: options.accounts,
      foreignApps: options.foreignApps,
      appArgs: options.appArgs,
      extraPages: options.extraPages,
      foreignAssets: options.foreignAssets,
      lease: options.lease,
    })

    return {
      transactionIds: result.txIDs,
      signedTransactions: result.signedTxns,
    }
  }

  appMinBalance(options: {
    extraPages?: number
    numGlobalByteSlices?: number
    numGlobalInts?: number
    numLocalByteSlices?: number
    numLocalInts?: number
  }): { create: number; optIn: number } {
    return calculateAppMinBalance(
      makeStateConfig(options.numGlobalInts, options.numGlobalByteSlices),
      makeStateConfig(options.numLocalInts, options.numLocalByteSlices),
      options.extraPages
    )
  }

  /**
   * Only allows exporting non-frozen assets
   */
  async generateExportTransactions(options: {
    assetIndex: number
    fromAccountAddress: string
    toAccountAddress: string
  }) {
    const suggestedParams = await this.algod.getTransactionParams().do()

    // Send funds to cover asset transfer transaction
    // Signed by funding account
    const fundsTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams,
      amount: 2000,
      from: this.fundingAccount.addr,
      to: options.fromAccountAddress,
    })

    // Opt-in to asset in recipient's non-custodial wallet
    // Signed by non-custodial wallet recipient
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      suggestedParams,
      amount: 0,
      assetIndex: options.assetIndex,
      from: options.toAccountAddress,
      to: options.toAccountAddress,
    })

    // Transfer asset to recipient and remove opt-in from sender
    // Signed by the user's custodial wallet
    const transferAssetTxn =
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        suggestedParams,
        assetIndex: options.assetIndex,
        from: options.fromAccountAddress,
        to: options.toAccountAddress,
        amount: 1,
        closeRemainderTo: options.toAccountAddress,
      })

    // Return min balance funds to funding account
    // Signed by the user's custodial wallet
    const returnFundsTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams,
      from: options.fromAccountAddress,
      to: this.fundingAccount.addr,
      amount: 100_000,
    })

    const transactions = [fundsTxn, optInTxn, transferAssetTxn, returnFundsTxn]

    const signers = [
      this.fundingAccount.addr,
      options.toAccountAddress,
      options.fromAccountAddress,
      options.fromAccountAddress,
    ]

    algosdk.assignGroupID(transactions)

    return transactions.map((txn, index) => {
      return {
        txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString(
          'base64'
        ),
        txnId: txn.txID(),
        signer: signers[index],
      }
    })
  }

  async signTransferTransactions(options: {
    passphrase: string
    encryptedMnemonic: string
    transactions: TransferCollectibleResult
  }) {
    const fromAccount = await decryptAccount(
      options.encryptedMnemonic,
      options.passphrase,
      this.options.appSecret
    )

    const signTxns = await configureSignTxns([fromAccount, this.fundingAccount])

    const signedTransactions = await signTxns(
      options.transactions.map((txn) => ({
        txn: txn.txn,
        signers: txn.signedTxn ? [] : [txn.signer],
        stxn: txn.signedTxn,
      }))
    )

    // const signedTransactions = options.transactions.map((transaction) => {
    //   if (transaction.signedTxn)
    //     return new Uint8Array(Buffer.from(transaction.signedTxn, 'base64'))

    //   const txn = algosdk.decodeUnsignedTransaction(
    //     Buffer.from(transaction.txn, 'base64')
    //   )

    //   const signer =
    //     transaction.signer === fromAccount.addr
    //       ? fromAccount
    //       : transaction.signer === this.fundingAccount.addr
    //       ? this.fundingAccount
    //       : null

    //   invariant(signer, 'unknown signer')

    //   return txn.signTxn(signer.sk)
    // })

    return {
      transactionIds: options.transactions.map(
        (transaction) => transaction.txnId
      ),
      signedTransactions,
    }
  }

  async generateImportTransactions(options: {
    assetIndex: number
    toAccountAddress: string
    fromAccountAddress: string
  }): Promise<{ txn: string; txnId: string; signer: string }[]> {
    const accountInfo = await this.getAccountInfo(options.toAccountAddress)
    const transactions: algosdk.Transaction[] = []
    const suggestedParams = await this.algod.getTransactionParams().do()
    const signers: string[] = []

    if (
      !accountInfo.assets.some(
        (asset) => asset.assetIndex === options.assetIndex
      )
    ) {
      // This account has not opted in to this asset
      // 0.1 Algo for opt-in, 1000 microAlgos for txn fee
      let minBalanceIncrease = 100_000 + 1000

      if (accountInfo.amount === 0) {
        // this is a brand new account, need to send additional funds
        minBalanceIncrease += 100_000
      }

      // Send funds to cover asset min balance increase
      // Signed by the funding account
      const fundsTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        suggestedParams,
        amount: minBalanceIncrease,
        from: this.fundingAccount.addr,
        to: options.toAccountAddress,
      })

      // Opt-in to asset
      // Signed by the user's custodial account
      const optInAssetTxn =
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          suggestedParams,
          assetIndex: options.assetIndex,
          from: options.toAccountAddress,
          to: options.toAccountAddress,
          amount: 0,
        })

      signers.push(this.fundingAccount.addr, options.toAccountAddress)
      transactions.push(fundsTxn, optInAssetTxn)
    }

    // Transfer asset to recipient and remove opt-in from sender
    // This transaction will be signed by the non-custodial account
    const transferAssetTxn =
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        suggestedParams,
        assetIndex: options.assetIndex,
        from: options.fromAccountAddress,
        to: options.toAccountAddress,
        amount: 1,
        closeRemainderTo: options.toAccountAddress,
      })

    signers.push(options.fromAccountAddress)
    transactions.push(transferAssetTxn)

    algosdk.assignGroupID(transactions)

    return transactions.map((txn, index) => {
      return {
        txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString(
          'base64'
        ),
        txnId: txn.txID(),
        signer: signers[index],
      }
    })
  }
}
