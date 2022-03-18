import { HttpTransport } from '@algomart/shared/utils'
import { Configuration } from '@api/configuration'
import { logger } from '@api/configuration/logger'

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
}

export default class AlgoExplorerAdapter {
  http: HttpTransport
  logger = logger.child({ context: this.constructor.name })

  constructor() {
    this.http = new HttpTransport(
      AlgoExplorerIndexerURLs[Configuration.algodEnv]
    )
  }

  async getAccount(address: string): Promise<AlgoExplorerAccount> {
    try {
      const {
        data: { account },
      } = await this.http.get<{ account: AlgoExplorerAccount }>(
        `accounts/${address}`
      )
      return account
    } catch (error) {
      this.logger.error(error as Error)
      throw error
    }
  }

  async getAccountsByAssetId(assetId: number): Promise<AlgoExplorerAccount[]> {
    try {
      const {
        data: { accounts },
      } = await this.http.get<{ accounts: AlgoExplorerAccount[] }>('accounts', {
        params: { 'asset-id': assetId },
      })
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
