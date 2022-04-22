import { CollectibleBase } from '@algomart/schemas'
import {
  AccountInfo,
  accountInformation,
  calculateAppMinBalance,
  configureSignTxns,
  createClawbackNFTTransactions,
  createConfigureCustodialAccountTransactions,
  createDeployContractTransactions,
  createExportNFTTransactions,
  createImportNFTTransactions,
  createNewNFTsTransactions,
  decodeTransaction,
  decryptAccount,
  encryptAccount,
  generateAccount,
  makeStateConfig,
  NewNFT,
  pendingTransactionInformation,
  waitForConfirmation,
  WalletTransaction,
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

  async generateExportTransactions(options: {
    assetIndex: number
    fromAccountAddress: string
    toAccountAddress: string
  }) {
    return await createExportNFTTransactions({
      algod: this.algod,
      assetIndex: options.assetIndex,
      fromAddress: options.fromAccountAddress,
      fundingAddress: this.fundingAccount.addr,
      clawbackAddress: this.fundingAccount.addr,
      toAddress: options.toAccountAddress,
    })
  }

  async signTransferTransactions(options: {
    passphrase: string
    encryptedMnemonic: string
    transactions: WalletTransaction[]
  }) {
    const fromAccount = await decryptAccount(
      options.encryptedMnemonic,
      options.passphrase,
      this.options.appSecret
    )

    const signTxns = await configureSignTxns([fromAccount, this.fundingAccount])

    const signedTransactions = await signTxns(options.transactions)

    return {
      transactionIds: await Promise.all(
        options.transactions.map(async (transaction) =>
          (await decodeTransaction(transaction.txn)).txID()
        )
      ),
      signedTransactions,
    }
  }

  async generateImportTransactions(options: {
    assetIndex: number
    toAccountAddress: string
    fromAccountAddress: string
  }): Promise<WalletTransaction[]> {
    return await createImportNFTTransactions({
      algod: this.algod,
      assetIndex: options.assetIndex,
      fromAddress: options.fromAccountAddress,
      toAddress: options.toAccountAddress,
      fundingAddress: this.fundingAccount.addr,
      clawbackAddress: this.fundingAccount.addr,
    })
  }
}
