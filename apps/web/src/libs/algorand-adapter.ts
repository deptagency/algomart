/* eslint-disable unicorn/numeric-separators-style */
import {
  AlgorandSendRawTransaction,
  AlgorandSuggestedParams,
  AlgorandTransformedAccountInfo,
  AlgorandTransformedAssetInfo,
} from '@algomart/schemas'
import {
  ChainType,
  TransactionInfo,
  UsdcAssetIdByChainType,
  WalletTransaction,
} from '@algomart/shared/algorand'
import type algosdk from 'algosdk'
import type {
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  Transaction,
} from 'algosdk'

import { apiFetcher } from '@/utils/react-query'
import { sleep } from '@/utils/sleep'
import { urlFor, urls } from '@/utils/urls'

export interface IAssetData {
  amount: number
  assetIndex: number
  creator?: string
  decimals: number
  isFrozen: boolean
  name?: string
  unitName?: string
  url?: string
}

export interface IConnector extends EventTarget {
  signTransaction(
    unsignedTransactions: WalletTransaction[],
    skipSubmit?: boolean
  ): Promise<(Uint8Array | null)[]>
  connect(): Promise<void>
  reconnect(): Promise<string[]>
  disconnect(): Promise<void>
}

const TIME_BETWEEN_BLOCKS = 4500

export class AlgorandAdapter {
  private _algosdk: typeof algosdk

  constructor(public readonly chainType: ChainType) {}

  private async algosdk() {
    if (this._algosdk === undefined) {
      this._algosdk = await import('algosdk')
    }
    return this._algosdk
  }

  public async getAssetData(
    address: string,
    loadDetails?: boolean
  ): Promise<IAssetData[]> {
    const accountInfo = await apiFetcher().get<AlgorandTransformedAccountInfo>(
      urlFor(urls.api.algorand.lookupAccount, null, { address })
    )
    const algoBalance = accountInfo.amount as number
    const assetsFromResponse: Array<{
      assetIndex: number
      amount: number
      isFrozen: boolean
    }> = accountInfo.assets ?? []

    const assets: IAssetData[] = assetsFromResponse.map(
      ({ assetIndex, amount, isFrozen }) => ({
        assetIndex: Number(assetIndex),
        amount,
        isFrozen,
        decimals: 0,
      })
    )

    assets.sort((a, b) => a.assetIndex - b.assetIndex)

    if (loadDetails) {
      await Promise.all(
        assets.map(async (asset) => {
          const { assetIndex } = asset
          const params = await apiFetcher().get<AlgorandTransformedAssetInfo>(
            urlFor(urls.api.algorand.lookupAsset, null, { assetIndex })
          )
          asset.creator = params.creator
          asset.unitName = params.unitName
          asset.url = params.url
          asset.name = params.name
          asset.decimals = params.decimals
        })
      )
    }

    assets.unshift({
      assetIndex: 0,
      amount: algoBalance,
      creator: '',
      isFrozen: false,
      decimals: 6,
      name: 'Algo',
      unitName: 'ALGO',
    })

    return assets
  }

  async sendRawTransaction(
    transaction: AlgorandSendRawTransaction
  ): Promise<string> {
    const { txId } = await apiFetcher().post<{ txId: string }>(
      urls.api.algorand.sendRawTransaction,
      { json: { transaction } }
    )

    return txId
  }

  async encodeUnsignedTransaction(txn: Transaction): Promise<Uint8Array> {
    const algosdk = await this.algosdk()
    return algosdk.encodeUnsignedTransaction(txn)
  }

  async decodeUnsignedTransaction(txn: string): Promise<Transaction> {
    const algosdk = await this.algosdk()
    return algosdk.decodeUnsignedTransaction(
      new Uint8Array(Buffer.from(txn, 'base64'))
    )
  }

  encodeSignedTransaction(txn: Uint8Array): string {
    return Buffer.from(txn).toString('base64')
  }

  async makeAssetTransferTransaction(
    params: Omit<
      Parameters<typeof makeAssetTransferTxnWithSuggestedParamsFromObject>[0],
      'suggestedParams'
    >
  ): Promise<Transaction> {
    const algosdk = await this.algosdk()
    const suggestedParams = await apiFetcher().get<AlgorandSuggestedParams>(
      urls.api.algorand.getTransactionParams
    )
    return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      suggestedParams,
      ...params,
    })
  }

  async hasOptedIn(address: string, assetIndex: number) {
    const assets = await this.getAssetData(address)
    return assets.some((asset) => asset.assetIndex === assetIndex)
  }

  async hasOptedInToUSDC(address: string) {
    return await this.hasOptedIn(
      address,
      UsdcAssetIdByChainType[this.chainType]
    )
  }

  async getTransactionStatus(trxID: string) {
    const { confirmedRound, poolError, assetIndex } =
      await apiFetcher().get<TransactionInfo>(
        urlFor(urls.api.algorand.lookupTransaction, null, { trxID })
      )

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
