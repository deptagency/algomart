import { DEFAULT_CURRENCY } from '@algomart/schemas'
import { Model } from 'objection'

import { Configuration } from '@/configuration'
import CoinbaseAdapter from '@/lib/coinbase-adapter'
import CollectiblesService from '@/modules/collectibles/collectibles.service'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

// TODO: RETHINK
export default async function updateCurrencyConversions(
  registry: DependencyResolver
) {
  const log = logger.child({ task: 'update-currency-conversions' })
  const coinbase = new CoinbaseAdapter({
    url: Configuration.coinbaseUrl,
  })
  const trx = await Model.startTransaction()
  try {
    const result = await coinbase.getExchangeRates({
      currency: DEFAULT_CURRENCY,
    })
    log.info('stored %d collectibles on IPFS', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to store collectibles')
  }
}
