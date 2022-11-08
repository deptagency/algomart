import {
  AlgorandSendRawTransaction,
  AlgorandTransformedAccountInfo,
  AlgorandTransformedTransactionInfo,
  CollectibleBase,
} from '@algomart/schemas'
import {
  calculateAppMinBalance,
  configureSignTxns,
  createClawbackNFTTransactions,
  createConfigureCustodialAccountTransactions,
  createDeployContractTransactions,
  createExportNFTTransactions,
  createImportNFTTransactions,
  createNewNFTsTransactions,
  createTradeTransactions,
  decodeTransaction,
  decryptAccount,
  encryptAccount,
  generateAccount,
  getAssetBalances,
  getTransactionParams,
  lookupAccount,
  lookupTransaction,
  makeStateConfig,
  NewNFT,
  sendRawTransaction,
  waitForConfirmation,
  WalletTransaction,
} from '@algomart/shared/algorand'
import { CollectibleModel } from '@algomart/shared/models'
import algosdk, { SuggestedParams } from 'algosdk'
import pino from 'pino'

// 100_000 microAlgos = 0.1 ALGO
export const DEFAULT_INITIAL_BALANCE = 100_000

export interface PublicAccount {
  address: string
  encryptedMnemonic: string
  transactionIds: string[]
  signedTransactions: Uint8Array[]
}

interface BaseAlgorandAdapterOptions {
  algodToken: string
  algodServer: string
  algodPort: number
  indexerToken: string
  indexerServer: string
  indexerPort: number
  fundingMnemonic: string
  enforcerAppID: number
  appSecret: string
  coldKeyAddress: string
}

interface CustomEncryptionAlgorandAdapterOptions
  extends BaseAlgorandAdapterOptions {
  encryptionFunction: (custodialMnemonic) => Promise<string>
  decryptionFunction: (encryptedCustodialMnemonic) => Promise<string>
}

export type AlgorandAdapterOptions =
  | BaseAlgorandAdapterOptions
  | CustomEncryptionAlgorandAdapterOptions

export class AlgorandAdapter {
  logger: pino.Logger<unknown>
  fundingAccount: algosdk.Account
  algod: algosdk.Algodv2
  indexer: algosdk.Indexer

  constructor(private options: AlgorandAdapterOptions, logger: pino.Logger) {
    this.logger = logger.child({ context: this.constructor.name })
    this.algod = new algosdk.Algodv2(
      options.algodToken,
      options.algodServer,
      options.algodPort
    )
    this.indexer = new algosdk.Indexer(
      options.indexerToken,
      options.indexerServer,
      options.indexerPort
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

    try {
      const status = await this.indexer.makeHealthCheck().do()
      this.logger.info({ status }, 'Successfully connected to Indexer')
    } catch (error) {
      this.logger.error(error, 'Failed to connect to Indexer')
    }
  }

  async encryptAccount(account: algosdk.Account) {
    return await encryptAccount(
      account,
      (this.options as CustomEncryptionAlgorandAdapterOptions)
        .encryptionFunction ?? this.options.appSecret
    )
  }

  async decryptAccount(encryptedMnemonic: string) {
    return await decryptAccount(
      encryptedMnemonic,
      this.options.appSecret,
      (this.options as CustomEncryptionAlgorandAdapterOptions)
        .decryptionFunction
    )
  }

  async generateAccount(): Promise<PublicAccount> {
    const account = await generateAccount()
    const encryptedMnemonic = await this.encryptAccount(account)
    return {
      address: account.addr,
      encryptedMnemonic,
      signedTransactions: [],
      transactionIds: [],
    }
  }

  async initialFundTransactions(
    encryptedMnemonic: string,
    initialBalance = DEFAULT_INITIAL_BALANCE
  ) {
    const custodialAccount = await this.decryptAccount(encryptedMnemonic)

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
    const info = await this.indexer
      .lookupAssetByID(assetIndex)
      .do()
      .catch(() => null)

    if (!info) {
      return null
    }

    const { asset } = info

    return {
      address: asset.index as number,
      creator: asset.params.creator as string,
      decimals: asset.params.decimals as number,
      defaultFrozen: asset.params['default-frozen'] as boolean,
      isFrozen: asset['is-frozen'] as boolean,
      name: asset.name as string,
      unitName: asset.params['unit-name'] as string,
      url: asset.params.url as string,
    }
  }

  async waitForConfirmation(transactionId: string, maxRounds = 5) {
    return waitForConfirmation(this.algod, transactionId, maxRounds)
  }

  async waitForAllConfirmations(transactionIds: string[], maxRounds = 5) {
    return await Promise.all(
      transactionIds.map(async (id) => {
        return await this.waitForConfirmation(id, maxRounds)
      })
    )
  }

  async getAccountInfo(
    account: string
  ): Promise<AlgorandTransformedAccountInfo> {
    return lookupAccount(this.indexer, account)
  }

  async getTransactionInfo(
    txID: string
  ): Promise<AlgorandTransformedTransactionInfo> {
    return lookupTransaction(this.indexer, txID)
  }

  async getTransactionParams(): Promise<SuggestedParams> {
    return await getTransactionParams(this.algod)
  }

  async getAssetOwner(assetIndex: number) {
    const balances = await getAssetBalances(this.indexer, assetIndex)
    const owner = balances.find((balance) => balance.amount > 0)
    return owner ? await this.getAccountInfo(owner.address) : null
  }

  async sendRawTransaction(transaction: AlgorandSendRawTransaction) {
    return sendRawTransaction(this.algod, transaction)
  }

  /**
   * Creates minting transactions for a list of collectibles. Should only be
   * used by Scribe as the `COLD_KEY_ADDRESS` is not available in the API.
   * @param collectibles The collectibles to be minted
   * @param templates Collectible templates to be used for minting
   * @returns ASA creation transactions
   */
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
        assetName: `${template.uniqueCode} #${collectible.edition}`,
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
      enforcerAppID: this.options.enforcerAppID,

      // TODO: these four should be removed once we rely on the enforcer contract
      // https://docs.google.com/document/d/1PBLS2Ouw359IkMryy2wkwXKtr5e1K9quZKiAgwVXkRg/edit
      // https://docs.google.com/document/d/1z0gNpM4d-qY9-9Td_az-pAUBEOZyZD_2npsb5-HeCaE/edit
      overrideManager: this.options.coldKeyAddress || this.fundingAccount.addr,
      overrideFreeze: this.options.coldKeyAddress || this.fundingAccount.addr,
      overrideClawback: this.fundingAccount.addr,
      overrideReserve: this.fundingAccount.addr,
    })

    return {
      signedTransactions: result.signedTxns,
      transactionIds: result.txIDs,
    }
  }

  async generateClawbackTransactions(options: {
    assetIndex: number
    encryptedMnemonic: string
    fromAccountAddress?: string
  }) {
    const toAccount = await this.decryptAccount(options.encryptedMnemonic)

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

  async generateTradeTransactions(options: {
    assetIndex: number
    buyerEncryptedMnemonic: string
    sellerEncryptedMnemonic: string
  }) {
    const buyerAccount = await this.decryptAccount(
      options.buyerEncryptedMnemonic
    )

    const sellerAccount = await this.decryptAccount(
      options.sellerEncryptedMnemonic
    )

    const result = await createTradeTransactions({
      algod: this.algod,
      assetIndex: options.assetIndex,
      buyerAccount,
      sellerAccount,
      clawbackAccount: this.fundingAccount,
      fundingAccount: this.fundingAccount,
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
    encryptedMnemonic: string
    transactions: WalletTransaction[]
  }) {
    const fromAccount = await this.decryptAccount(options.encryptedMnemonic)

    const signTxns = await configureSignTxns([fromAccount, this.fundingAccount])

    const signedTransactions = await signTxns(options.transactions)

    return {
      transactionIds: await Promise.all(
        options.transactions.map(async (transaction) => {
          const txn = await decodeTransaction(transaction.txn)
          return txn.txID()
        })
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
      indexer: this.indexer,
      toAddress: options.toAccountAddress,
      fundingAddress: this.fundingAccount.addr,
      clawbackAddress: this.fundingAccount.addr,
    })
  }
}
