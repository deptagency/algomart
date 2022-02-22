import { DEFAULT_CURRENCY } from '@algomart/schemas'
import { I18nService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Currency } from '@dinero.js/currencies'
import { Model } from 'objection'
import pino from 'pino'

export async function updateCurrencyConversionsTask(
  registry: DependencyResolver,
  currency: Currency<number> | undefined,
  logger: pino.Logger<unknown>,
  knexRead?: Knex
) {
  const log = logger.child({ task: 'update-currency-conversions' })
  const sourceCurrency = currency?.code || DEFAULT_CURRENCY
  const i18nService = registry.get<I18nService>(I18nService.name)
  const trx = await Model.startTransaction()
  try {
    const result = await i18nService.getCurrencyConversions(
      {
        sourceCurrency,
      },
      trx,
      knexRead
    )
    log.info(
      `stored ${Object.keys(result).length
      } currency conversions for ${sourceCurrency} in db`,
      result
    )
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to store currency conversions')
  }
}
