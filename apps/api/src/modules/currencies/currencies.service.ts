import { Transaction } from 'objection'

import CoinbaseAdapter from '@/lib/coinbase-adapter'
import { CurrencyConversionModel } from '@/models/currency.model'
import { logger } from '@/utils/logger'

export default class CurrenciesService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly coinbase: CoinbaseAdapter) {}

  async getCurrencyConversion(
    {
      sourceCurrency,
      targetCurrency,
    }: {
      sourceCurrency: string
      targetCurrency?: string
    },
    trx?: Transaction
  ) {
    // 1st: grab all conversion for currency from db
    const conversions = await CurrencyConversionModel.query(trx)
      .groupBy('sourceCurrency')
      .where('sourceCurrency', sourceCurrency)

    // 2nd: filter down to just the conversion we want if it exists and is fresh
    const past1Hour = new Date(new Date().setDate(new Date().getHours() - 1))
    let conversion = conversions.find(
      (conversion) =>
        conversion.targetCurrency === targetCurrency &&
        new Date(conversion?.updatedAt) < past1Hour
    )

    // 3rd: if no conversion (or old) grab from coinbase and upsert ALL rows for given currency, returning the
    if (!conversion) {
      const { rates } = await this.coinbase.getExchangeRates({
        currency: sourceCurrency,
      })
      const now = new Date().toISOString()
      const conversions = await CurrencyConversionModel.query(trx)
        .groupBy('sourceCurrency')
        .upsertGraphAndFetch(
          Object.keys(rates).map((code) => ({
            sourceCurrency,
            targetCurrency: code,
            exchangeRate: rates[code],
            updatedAt: now,
          }))
        )

      conversion = conversions.find(
        (conversion) => conversion.targetCurrency === targetCurrency
      )
    }

    return conversion
  }

  async getCurrencyConversions(
    {
      sourceCurrency,
    }: {
      sourceCurrency: string
    },
    trx?: Transaction
  ) {
    // 1st: grab all conversion for currency from db
    let conversions = await CurrencyConversionModel.query(trx)
      .groupBy('sourceCurrency')
      .where('sourceCurrency', sourceCurrency)

    // 2nd: find if any conversions are stale
    const past1Hour = new Date(new Date().setDate(new Date().getHours() - 1))
    const staleConversion = conversions.find(
      (conversion) => new Date(conversion?.updatedAt) > past1Hour
    )

    // 3rd: if any are stale, regrab from coinbase and upsert ALL rows for given currency
    if (staleConversion) {
      const { rates } = await this.coinbase.getExchangeRates({
        currency: sourceCurrency,
      })
      const now = new Date().toISOString()
      conversions = await CurrencyConversionModel.query(trx)
        .groupBy('sourceCurrency')
        .upsertGraphAndFetch(
          Object.keys(rates).map((code) => ({
            sourceCurrency,
            targetCurrency: code,
            exchangeRate: rates[code],
            updatedAt: now,
          }))
        )
    }

    return conversions
  }
}
