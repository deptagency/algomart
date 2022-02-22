import { DEFAULT_CURRENCY } from '@algomart/schemas'
import { I18nService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Model } from 'objection'

import { Configuration } from '../configuration'
import { logger } from '../configuration/logger'

export default async function updateCurrencyConversions(
  registry: DependencyResolver
) {
  const log = logger.child({ task: 'update-currency-conversions' })
  const sourceCurrency = Configuration.currency?.code || DEFAULT_CURRENCY
  const i18nService = registry.get<I18nService>(I18nService.name)
  const trx = await Model.startTransaction()
  try {
    const result = await i18nService.getCurrencyConversions(
      {
        sourceCurrency,
      },
      trx
    )
    log.info(
      `stored ${
        Object.keys(result).length
      } currency conversions for ${sourceCurrency} in db`,
      result
    )
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to store currency conversions')
  }
}
