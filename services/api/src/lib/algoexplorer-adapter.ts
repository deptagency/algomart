import got from 'got'

import { Configuration } from '@/configuration'
import { logger } from '@/utils/logger'

/**
 * AlgoExplorer APIv2 Docs:
 * https://testnet.algoexplorer.io/api-dev/v2
 */

interface AlgoExplorerAsset {
  amount: number
  'asset-id': number
  creator: string
  'is-frozen': boolean
}

interface AlgoExplorerAccount {
  address: string
  amount: number
  assets: AlgoExplorerAsset[]
}

export default class AlgoExplorerAdapter {
  algoExplorerUrl: string
  logger = logger.child({ context: this.constructor.name })

  constructor() {
    this.algoExplorerUrl = this.configureAlgoExplorerUrl()
  }

  configureAlgoExplorerUrl() {
    switch (Configuration.algodEnv) {
      case 'betanet':
        return 'https://betanet.algoexplorerapi.io/v2'
      case 'mainnet':
        return 'https://algoexplorerapi.io/v2'
      default:
        return 'https://testnet.algoexplorerapi.io/v2'
    }
  }

  async getAccount(address: string) {
    try {
      const account = await got<AlgoExplorerAccount>(
        `${this.algoExplorerUrl}/accounts/${address}`
      ).json<AlgoExplorerAccount>()
      return account
    } catch (error) {
      this.logger.error(error as Error)
      throw error
    }
  }
}
