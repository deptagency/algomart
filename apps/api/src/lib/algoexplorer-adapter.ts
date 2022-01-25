import got from 'got'

import { Configuration } from '@/configuration'
import { logger } from '@/utils/logger'

/**
 * AlgoExplorer APIv2 Docs:
 * https://testnet.algoexplorer.io/api-dev/v2
 */

interface AlgoExplorerAssetHolding {
  'asset-id': number
  amount: number
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
}

export default class AlgoExplorerAdapter {
  algoExplorerUrl: string
  logger = logger.child({ context: this.constructor.name })

  constructor() {
    this.algoExplorerUrl = AlgoExplorerIndexerURLs[Configuration.algodEnv]
  }

  async getAccount(address: string): Promise<AlgoExplorerAccount> {
    try {
      const { account } = await got<AlgoExplorerAccount>(
        `${this.algoExplorerUrl}/accounts/${address}`
      ).json<{ account: AlgoExplorerAccount }>()
      return account
    } catch (error) {
      this.logger.error(error as Error)
      throw error
    }
  }

  async getAccountsByAssetId(assetId: number): Promise<AlgoExplorerAccount[]> {
    try {
      // https://algoindexer.testnet.algoexplorerapi.io/v2
      const { accounts } = await got<AlgoExplorerAccount[]>(
        `${this.algoExplorerUrl}/accounts?asset-id=${assetId}`
      ).json<{ accounts: AlgoExplorerAccount[] }>()
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
