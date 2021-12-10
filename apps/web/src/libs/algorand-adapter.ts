import type {
  Algodv2,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
  Transaction,
} from 'algosdk'

import { EventEmitter } from './event-emitter'

const algosdkLoader = import('algosdk')

export enum ChainType {
  MainNet = 'mainnet',
  TestNet = 'testnet',
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
  [ChainType.MainNet]: 'https://algoexplorerapi.io',
  [ChainType.TestNet]: 'https://testnet.algoexplorerapi.io',
}

export class AlgorandAdapter {
  private _algod: Algodv2 | null = null

  constructor(public readonly chainType: ChainType) {}

  private async algod() {
    if (this._algod === null) {
      const algosdk = await algosdkLoader
      this._algod = new algosdk.Algodv2('', ALGOD_URL[this.chainType], '')
    }
    return this._algod
  }

  public async getAssetData(address: string): Promise<IAssetData[]> {
    const client = await this.algod()
    const accountInfo = await client.accountInformation(address).do()

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
        const { params } = await client.getAssetByID(asset.id).do()
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

  async sendRawTransaction(txn: Uint8Array | Uint8Array[]): Promise<string> {
    const client = await this.algod()
    const { txID } = await client.sendRawTransaction(txn).do()
    return txID
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
}
