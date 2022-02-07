import type {
  Algodv2,
  Indexer,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
  Transaction,
} from 'algosdk'

import { EventEmitter } from './event-emitter'

import { sleep } from '@/utils/sleep'

const algosdkLoader = import('algosdk')

export enum ChainType {
  MainNet = 'mainnet',
  TestNet = 'testnet',
  BetaNet = 'betanet',
}

export interface IAssetData {
  id: number
  amount: number
  creator: string
  frozen: boolean
  decimals: number
  name?: string
  unitName?: string
  url?: string
}

export interface IConnector extends EventEmitter {
  signTransaction(
    transaction: Transaction,
    message?: string
  ): Promise<Uint8Array>
  connect(): Promise<void>
  disconnect(): Promise<void>
}

const ALGOD_URL = {
  [ChainType.MainNet]: 'https://node.algoexplorerapi.io',
  [ChainType.TestNet]: 'https://node.testnet.algoexplorerapi.io',
}

const INDEXER_URL = {
  [ChainType.MainNet]: 'https://algoindexer.algoexplorerapi.io',
  [ChainType.TestNet]: 'https://algoindexer.testnet.algoexplorerapi.io',
}

const TIME_BETWEEN_BLOCKS = 4500

export class AlgorandAdapter {
  private _algod: Algodv2 | null = null
  private _indexer: Indexer | null = null

  constructor(public readonly chainType: ChainType) {}

  private async algod() {
    if (this._algod === null) {
      const algosdk = await algosdkLoader
      this._algod = new algosdk.Algodv2('', ALGOD_URL[this.chainType], '')
    }
    return this._algod
  }

  private async indexer() {
    if (this._indexer === null) {
      const algosdk = await algosdkLoader
      this._indexer = new algosdk.Indexer('', INDEXER_URL[this.chainType], '')
    }
    return this._indexer
  }

  public async getAssetData(address: string): Promise<IAssetData[]> {
    const indexer = await this.indexer()
    const { account: accountInfo } = await indexer
      .lookupAccountByID(address)
      .do()

    const algoBalance = accountInfo.amount as number
    const assetsFromResponse: Array<{
      'asset-id': number
      amount: number
      creator: string
      frozen: boolean
    }> = accountInfo.assets

    const assets: IAssetData[] = assetsFromResponse.map(
      ({ 'asset-id': id, amount, creator, frozen }) => ({
        id: Number(id),
        amount,
        creator,
        frozen,
        decimals: 0,
      })
    )

    assets.sort((a, b) => a.id - b.id)

    await Promise.all(
      assets.map(async (asset) => {
        const {
          asset: { params },
        } = await indexer.lookupAssetByID(asset.id).do()
        asset.name = params.name
        asset.unitName = params['unit-name']
        asset.url = params.url
        asset.decimals = params.decimals
      })
    )

    assets.unshift({
      id: 0,
      amount: algoBalance,
      creator: '',
      frozen: false,
      decimals: 6,
      name: 'Algo',
      unitName: 'ALGO',
    })

    return assets
  }

  async makeAssetOptInTransaction(
    assetIndex: number,
    recipient: string
  ): Promise<Transaction> {
    const algosdk = await algosdkLoader
    const client = await this.algod()
    return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      suggestedParams: await client.getTransactionParams().do(),
      assetIndex,
      from: recipient,
      to: recipient,
      amount: 0,
    })
  }

  async sendRawTransaction(txn: Uint8Array | Uint8Array[]): Promise<string> {
    const client = await this.algod()
    const { txId } = await client.sendRawTransaction(txn).do()
    return txId
  }

  async encodeUnsignedTransaction(txn: Transaction): Promise<Uint8Array> {
    const algosdk = await algosdkLoader
    return algosdk.encodeUnsignedTransaction(txn)
  }

  async makeAssetTransferTransaction(
    params: Omit<
      Parameters<typeof makeAssetTransferTxnWithSuggestedParamsFromObject>[0],
      'suggestedParams'
    >
  ): Promise<Transaction> {
    const algosdk = await algosdkLoader
    const client = await this.algod()
    return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      suggestedParams: await client.getTransactionParams().do(),
      ...params,
    })
  }

  async makePaymentTransaction(
    params: Omit<
      Parameters<typeof makePaymentTxnWithSuggestedParamsFromObject>[0],
      'suggestedParams'
    >
  ): Promise<Transaction> {
    const algosdk = await algosdkLoader
    const client = await this.algod()
    return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams: await client.getTransactionParams().do(),
      ...params,
    })
  }

  async hasOptedIn(address: string, assetIndex: number) {
    const assets = await this.getAssetData(address)
    return assets.some((asset) => asset.id === assetIndex)
  }

  async getTransactionStatus(transactionId: string) {
    const indexer = await this.indexer()
    const { transaction: info } = await indexer
      .lookupTransactionByID(transactionId)
      .do()
      .catch(() => ({ transaction: {} }))
    const confirmedRound: number = info['confirmed-round'] || 0
    const poolError: string = info['pool-error'] || ''
    const assetIndex: number = info['asset-index'] || 0
    return { confirmedRound, poolError, assetIndex }
  }

  async waitForConfirmation(transactionId: string, maxAttempts = 5) {
    let attempts = 0

    while (attempts < maxAttempts) {
      const status = await this.getTransactionStatus(transactionId)

      if (status.confirmedRound || status.poolError) {
        return status
      }

      attempts += 1
      await sleep(TIME_BETWEEN_BLOCKS)
    }

    throw new Error(
      `Too many rounds elapsed when waiting for confirmation: ${transactionId}`
    )
  }
}
