import { DEFAULT_LOCALE, LanguageList } from '@algomart/schemas'
import { Transaction } from 'objection'

import CoinbaseAdapter from '@/lib/coinbase-adapter'
import DirectusAdapter from '@/lib/directus-adapter'
import { CurrencyConversionModel } from '@/models/currency.model'
import { currency } from '@/utils/format-currency'
import { userInvariant } from '@/utils/invariant'

export default class LanguagesService {
  constructor(
    private readonly cms: DirectusAdapter,
    private readonly coinbase: CoinbaseAdapter
  ) {}

  async getLanguages(locale = DEFAULT_LOCALE): Promise<LanguageList> {
    const languages = await this.cms.getLanguages(locale)
    userInvariant(languages, 'languages not found', 404)

    return languages
  }

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
      sourceCurrency = currency.code,
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
