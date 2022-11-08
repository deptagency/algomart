import { CurrencyConversionDict, DropdownLanguageList } from '@algomart/schemas'
import { CoinbaseAdapter } from '@algomart/shared/adapters'
import { invariant } from '@algomart/shared/utils'
import * as Currencies from '@dinero.js/currencies'
import pino from 'pino'

import { CMSCacheService } from './cms-cache.service'

export interface I18nServiceOptions {
  currency: Currencies.Currency<number>
}

export class I18nService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly options: I18nServiceOptions,
    private readonly cms: CMSCacheService,
    private readonly coinbase: CoinbaseAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async getLanguages(): Promise<DropdownLanguageList> {
    const languages = await this.cms.getLanguages()
    invariant(languages, 'languages not found')

    return languages
  }

  async getCurrencyConversions({
    sourceCurrency = this.options.currency.code,
  }: {
    sourceCurrency?: string
  }): Promise<CurrencyConversionDict> {
    const { rates } = await this.coinbase.getExchangeRates({
      currency: sourceCurrency,
    })

    invariant(
      rates,
      'Error receiving exchange rates from coinbase: No rates available.'
    )

    const now = new Date().toISOString()
    const conversions = Object.keys(rates).map((code) => ({
      sourceCurrency,
      targetCurrency: code,
      exchangeRate: Number.parseFloat(rates[code]),
      updatedAt: now,
    }))

    // push matching exchange rate, helpful for ui conversions
    conversions.push({
      sourceCurrency,
      targetCurrency: sourceCurrency,
      exchangeRate: 1,
      updatedAt: now,
    })

    const conversionsDict = {}
    for (const conversion of conversions) {
      conversionsDict[conversion.targetCurrency] = conversion.exchangeRate
    }

    return conversionsDict
  }
}
