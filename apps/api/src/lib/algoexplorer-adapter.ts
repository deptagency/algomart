import got, { Got } from 'got'

import { Configuration } from '@/configuration'
import { logger } from '@/utils/logger'

/**
 * AlgoExplorer APIv2 Docs:
 * https://testnet.algoexplorer.io/api-dev/v2
 */

interface AlgoExplorerAssetHolding {
  'asset-id': number
  amount: number
  'is-frozen': boolean
}

interface AlgoExplorerAccount {
  address: string
  amount: number
  'amount-without-pending-rewards': number
  'apps-total-schema': { 'num-uint': number; 'num-byte-slice': number }
  'apps-total-extra-pages': number
  assets: AlgoExplorerAssetHolding[]
}

const AlgoExplorerIndexerURLs = {
  mainnet: 'https://algoindexer.algoexplorerapi.io/v2',
  testnet: 'https://algoindexer.testnet.algoexplorerapi.io/v2',
  betanet: 'https://algoindexer.betanet.algoexplorerapi.io/v2',
  sandnet: 'http://localhost:8980/v2',
}

export default class AlgoExplorerAdapter {
  http: Got
  logger = logger.child({ context: this.constructor.name })

  constructor() {
    this.http = got.extend({
      prefixUrl: AlgoExplorerIndexerURLs[Configuration.algodEnv],
    })
  }

  async getAccount(address: string): Promise<AlgoExplorerAccount> {
    try {
      const { account } = await this.http
        .get(`accounts/${address}`)
        .json<{ account: AlgoExplorerAccount }>()
      return account
    } catch (error) {
      this.logger.error(error as Error)
      throw error
    }
  }

  async getAccountsByAssetId(assetId: number): Promise<AlgoExplorerAccount[]> {
    try {
      const { accounts } = await this.http
        .get('accounts', {
          searchParams: { 'asset-id': assetId },
        })
        .json<{ accounts: AlgoExplorerAccount[] }>()
      return accounts
    } catch (error) {
      this.logger.error(error as Error)
      throw error
    }
  }

  async getCurrentAssetOwner(
    assetId: number
  ): Promise<AlgoExplorerAccount | null> {
    try {
      const accounts = await this.getAccountsByAssetId(assetId)
      const currentAccount = accounts.find((account) =>
        account.assets.some(
          (asset) => asset['asset-id'] === assetId && asset.amount === 1
        )
      )
      return currentAccount ?? null
    } catch (error) {
      this.logger.error(error as Error)
      throw error
    }
  }
}
