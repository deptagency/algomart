import {
  CoinbaseExchangeRates,
  CoinbaseExchangeRatesOptions,
  CoinbaseResponse,
  isCoinbaseSuccessResponse,
} from '@algomart/schemas'
import got, { Got } from 'got'
import { URLSearchParams } from 'node:url'

import { logger } from '@/utils/logger'

interface CoinbaseAdapterOptions {
  url: string
}

export default class CoinbaseAdapter {
  logger = logger.child({ context: this.constructor.name })
  http: Got

  constructor(readonly options: CoinbaseAdapterOptions) {
    this.http = got.extend({
      prefixUrl: options.url,
    })
  }

  async ping() {
    const response = await this.http.get('ping')
    return response.statusCode === 200
  }

  async getExchangeRates(
    request: CoinbaseExchangeRatesOptions
  ): Promise<CoinbaseExchangeRates | null> {
    const searchParameters = new URLSearchParams()
    if (request.currency) searchParameters.set('currency', request.currency)

    const response = await this.http
      .get('v2/exchange-rates', { searchParams: searchParameters })
      .json<CoinbaseResponse<CoinbaseExchangeRates>>()

    if (isCoinbaseSuccessResponse(response)) {
      return response.data
    }

    this.logger.error({ response }, 'Failed to get exchange rates')
    return null
  }
}
