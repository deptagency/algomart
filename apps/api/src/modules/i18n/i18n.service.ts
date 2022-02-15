import { DEFAULT_LOCALE, LanguageList } from '@algomart/schemas'
import { Transaction } from 'objection'

import { Configuration } from '@/configuration'
import CoinbaseAdapter from '@/lib/coinbase-adapter'
import DirectusAdapter from '@/lib/directus-adapter'
import { CurrencyConversionModel } from '@/models/currency.model'
import { invariant } from '@/utils/invariant'

export default class I18nService {
  constructor(
    private readonly cms: DirectusAdapter,
    private readonly coinbase: CoinbaseAdapter
  ) {}

  async getLanguages(locale = DEFAULT_LOCALE): Promise<LanguageList> {
    const languages = await this.cms.getLanguages(locale)
    invariant(languages, 'languages not found')

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
    let conversions = await CurrencyConversionModel.query(trx)
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
    if (conversions.length === 0 || !conversion) {
      const { rates } = await this.coinbase.getExchangeRates({
        currency: sourceCurrency,
      })
      const now = new Date().toISOString()
      const upserts = Object.keys(rates).map((code) => ({
        id: conversions?.find(
          (conversion) => conversion?.targetCurrency === code
        )?.id,
        sourceCurrency,
        targetCurrency: code,
        exchangeRate: rates[code],
        updatedAt: now,
      }))

      conversions = await CurrencyConversionModel.query(
        trx
      ).upsertGraphAndFetch(upserts)

      conversion = conversions.find(
        (conversion) => conversion.targetCurrency === targetCurrency
      )
    }

    return conversion
  }

  async getCurrencyConversions(
    {
      sourceCurrency = Configuration.currency.code,
    }: {
      sourceCurrency?: string
    },
    trx?: Transaction
  ) {
    // 1st: grab all conversion for currency from db
    let conversions = await CurrencyConversionModel.query(trx).where(
      'sourceCurrency',
      sourceCurrency
    )

    // 2nd: find if any conversions are stale
    const past1Hour = new Date(new Date().setDate(new Date().getHours() - 1))
    const staleConversion = conversions.find(
      (conversion) => new Date(conversion?.updatedAt) > past1Hour
    )

    // 3rd: if no conversions or any are stale, regrab from coinbase and upsert ALL rows for given currency
    // eslint-disable-next-line no-extra-boolean-cast
    // eslint-disable-next-line no-constant-condition
    if (conversions.length === 0 || staleConversion) {
      const { rates } = await this.coinbase.getExchangeRates({
        currency: sourceCurrency,
      })
      const now = new Date().toISOString()
      const upserts = Object.keys(rates).map((code) => ({
        id: conversions?.find(
          (conversion) => conversion?.targetCurrency === code
        )?.id,
        sourceCurrency,
        targetCurrency: code,
        exchangeRate: Number.parseFloat(rates[code]),
        updatedAt: now,
      }))

      // push matching exchange rate, helpful for ui conversions
      upserts.push({
        id: conversions?.find(
          (conversion) => conversion?.targetCurrency === sourceCurrency
        )?.id,
        sourceCurrency,
        targetCurrency: sourceCurrency,
        exchangeRate: 1,
        updatedAt: now,
      })

      conversions = await CurrencyConversionModel.query(
        trx
      ).upsertGraphAndFetch(upserts)
    }

    invariant(conversions, 'conversions not found')

    const conversionsDict = {}
    for (const conversion of conversions) {
      conversionsDict[conversion.targetCurrency] = conversion.exchangeRate
    }

    return conversionsDict
  }
}
