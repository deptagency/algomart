import pino from 'pino'
import { CollectibleBase, TransferCollectibleResult } from '@algomart/schemas'
import { CollectibleModel } from '@algomart/shared/models'
import { decrypt, encrypt, invariant } from '@algomart/shared/utils'
import algosdk from 'algosdk'

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

export interface AccountInfo {
  address: string
  amount: number
  amountWithoutPendingRewards: number
  // https://developer.algorand.org/docs/rest-apis/algod/v2/#applicationlocalstate
  appsLocalState: {
    id: number
  }[]
  appsTotalExtraPages?: number
  appsTotalSchema: {
    numByteSlices: number
    numInts: number
  }
  assets: {
    amount: number
    assetId: number
    creator: string
    isFrozen: boolean
  }[]
  authAddr?: string
  // https://developer.algorand.org/docs/rest-apis/algod/v2/#applicationparams
  createdApps: {
    id: number
  }[]
  // https://developer.algorand.org/docs/rest-apis/algod/v2/#asset
  createdAssets: {
    index: number
  }[]
  // https://developer.algorand.org/docs/rest-apis/algod/v2/#accountparticipation
  participation?: unknown
  pendingRewards: number
  rewardBase: number
  rewards: number
  round: number
  sigType: 'sig' | 'msig' | 'lsig'
  status: string
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

  generateAccount(passphrase: string): PublicAccount {
    const account = algosdk.generateAccount()
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk)
    const encryptedMnemonic = encrypt(
      mnemonic,
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

  async createAccount(
    passphrase: string,
    initialBalance = DEFAULT_INITIAL_BALANCE
  ): Promise<PublicAccount> {
    const account = algosdk.generateAccount()
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk)
    const encryptedMnemonic = encrypt(
      mnemonic,
      passphrase,
      this.options.appSecret
    )

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
      decrypt(encryptedMnemonic, passphrase, this.options.appSecret)
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
      const mnemonic = decrypt(
        encryptedMnemonic,
        passphrase,
        this.options.appSecret
      )
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

  async closeCreatorAccount(creator: PublicAccount, passphrase: string) {
    const account = algosdk.mnemonicToSecretKey(
      decrypt(creator.encryptedMnemonic, passphrase, this.options.appSecret)
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
      address: info['address'],
      amount: info['amount'],
      amountWithoutPendingRewards: info['amount-without-pending-rewards'],
      appsLocalState: info['apps-local-state'] || [],
      appsTotalExtraPages: info['apps-total-extra-pages'] || 0,
      appsTotalSchema: {
        numByteSlices: info['apps-total-schema']?.['num-byte-slice'] || 0,
        numInts: info['apps-total-schema']?.['num-uint'] || 0,
      },
      assets: (info['assets'] || []).map((asset) => ({
        assetId: asset['asset-id'],
        amount: asset['amount'],
        creator: asset['creator'],
        isFrozen: asset['is-frozen'],
      })),
      authAddr: info['auth-addr'],
      createdApps: info['created-apps'] || [],
      createdAssets: info['created-assets'] || [],
      participation: info['participation'],
      pendingRewards: info['pending-rewards'],
      rewardBase: info['reward-base'],
      rewards: info['rewards'],
      round: info['round'],
      sigType: info['sig-type'],
      status: info['status'],
    }
  }

  getAccountMinBalance(info: AccountInfo): number {
    const minBalance = 100_000
    const assetsOptIn = info.assets.length * 100_000
    const assetsCreated = info.createdAssets.length * 100_000
    const appsBytes = info.appsTotalSchema.numByteSlices * 50_000
    const appsInts = info.appsTotalSchema.numInts * 28_500
    const appsOptIn = info.appsLocalState.length * 100_000
    const appsCreated = info.createdApps.length * 100_000
    const total =
      minBalance +
      assetsOptIn +
      assetsCreated +
      appsBytes +
      appsInts +
      appsOptIn +
      appsCreated
    return total
  }

  async getCreatorAccount(initialBalance: number, passphrase: string) {
    const fundingAccountInfo = await this.getAccountInfo(
      this.fundingAccount.addr
    )

    invariant(
      fundingAccountInfo.amount > initialBalance + 100_000,
      `Not enough funds on account ${fundingAccountInfo.address}. Have ${
        fundingAccountInfo.amount
      } microAlgos, need ${initialBalance + 100_000} microAlgos.`
    )

    const creator = await this.createAccount(passphrase, initialBalance)

    await this.submitTransaction(creator.signedTransactions)

    // Just need to wait for the funding transaction to complete
    await this.waitForConfirmation(creator.transactionIds[0])

    return creator
  }

  async generateCreateAssetTransactions(
    collectibles: CollectibleModel[],
    templates: CollectibleBase[]
  ) {
    invariant(
      collectibles.length <= 16,
      'Can only mint up to 16 assets at a time'
    )

    const suggestedParams = await this.algod.getTransactionParams().do()
    const templateLookup = new Map(templates.map((t) => [t.templateId, t]))

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
        from: this.fundingAccount.addr,
        total: 1,
        decimals: 0,
        defaultFrozen: false,
        clawback: this.fundingAccount.addr,
        manager: this.fundingAccount.addr,
        unitName: template.uniqueCode,
        suggestedParams,
      })
    })

    algosdk.assignGroupID(transactions)

    const signedTransactions = transactions.map((transaction) =>
      transaction.signTxn(this.fundingAccount.sk)
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
      decrypt(
        options.encryptedMnemonic,
        options.passphrase,
        this.options.appSecret
      )
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

  async generateClawbackTransactionsFromUser(options: {
    assetIndex: number
    fromAccountAddress: string
    toAccountAddress: string
  }) {
    const suggestedParams = await this.algod.getTransactionParams().do()

    // Use a clawback to "revoke" ownership from current owner to the creator,
    const clawbackTxn =
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        suggestedParams,
        amount: 1,
        assetIndex: options.assetIndex,
        from: this.fundingAccount.addr, // Who is issuing the transaction
        to: options.toAccountAddress,
        revocationTarget: options.fromAccountAddress, // Who the asset is being revoked from
      })

    // Adds a group id to each transaction object
    algosdk.assignGroupID([clawbackTxn])

    const signedTransactions = [clawbackTxn.signTxn(this.fundingAccount.sk)]

    return {
      transactionIds: [clawbackTxn.txID()],
      signedTransactions,
    }
  }

  async compileContract(source: string): Promise<Uint8Array> {
    const compiled = await this.algod.compile(source).do()
    return new Uint8Array(Buffer.from(compiled.result, 'base64'))
  }

  async createApplicationTransaction(options: {
    approvalProgram: Uint8Array
    clearProgram: Uint8Array
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
    note?: Uint8Array
    rekeyTo?: string
    from?: string
  }) {
    const suggestedParams = await this.algod.getTransactionParams().do()

    const txn = algosdk.makeApplicationCreateTxnFromObject({
      suggestedParams,
      approvalProgram: options.approvalProgram,
      clearProgram: options.clearProgram,
      from: options.from || this.fundingAccount.addr,
      numGlobalByteSlices: options.numGlobalByteSlices || 0,
      numGlobalInts: options.numGlobalInts || 0,
      numLocalByteSlices: options.numLocalByteSlices || 0,
      numLocalInts: options.numLocalInts || 0,
      extraPages: options.extraPages || 0,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: options.appArgs,
      accounts: options.accounts || [],
      foreignApps: options.foreignApps,
      foreignAssets: options.foreignAssets,
      lease: options.lease,
      note: options.note,
      rekeyTo: options.rekeyTo,
    })

    return txn
  }

  appMinBalance(options: {
    extraPages?: number
    numGlobalByteSlices?: number
    numGlobalInts?: number
    numLocalByteSlices?: number
    numLocalInts?: number
  }): { create: number; optIn: number } {
    const {
      extraPages = 0,
      numGlobalByteSlices: numberGlobalByteSlices = 0,
      numGlobalInts: numberGlobalInts = 0,
      numLocalByteSlices: numberLocalByteSlices = 0,
      numLocalInts: numberLocalInts = 0,
    } = options

    // https://developer.algorand.org/docs/get-details/dapps/smart-contracts/apps/#minimum-balance-requirement-for-a-smart-contract

    return {
      create:
        100_000 * (1 + extraPages) +
        28_500 * numberGlobalInts +
        50_000 * numberGlobalByteSlices,
      optIn:
        100_000 + 28_500 * numberLocalInts + 50_000 * numberLocalByteSlices,
    }
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
    const fromAccount = algosdk.mnemonicToSecretKey(
      decrypt(
        options.encryptedMnemonic,
        options.passphrase,
        this.options.appSecret
      )
    )

    const signedTransactions = options.transactions.map((transaction) => {
      if (transaction.signedTxn)
        return new Uint8Array(Buffer.from(transaction.signedTxn, 'base64'))

      const txn = algosdk.decodeUnsignedTransaction(
        Buffer.from(transaction.txn, 'base64')
      )

      const signer =
        transaction.signer === fromAccount.addr
          ? fromAccount
          : transaction.signer === this.fundingAccount.addr
          ? this.fundingAccount
          : null

      invariant(signer, 'unknown signer')

      return txn.signTxn(signer.sk)
    })

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
      !accountInfo.assets.some((asset) => asset.assetId === options.assetIndex)
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
