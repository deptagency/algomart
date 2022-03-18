import {
  CoinbaseExchangeRates,
  CoinbaseExchangeRatesOptions,
  CoinbaseResponse,
  isCoinbaseSuccessResponse,
} from '@algomart/schemas'
import { HttpTransport } from '@algomart/shared/utils'
import { logger } from '@api/configuration/logger'

interface CoinbaseAdapterOptions {
  url: string
}

export default class CoinbaseAdapter {
  logger = logger.child({ context: this.constructor.name })
  http: HttpTransport

  constructor(readonly options: CoinbaseAdapterOptions) {
    this.http = new HttpTransport(options.url)
  }

  async ping() {
    const response = await this.http.get('ping')
    return response.status === 200
  }

  async getExchangeRates(
    request: CoinbaseExchangeRatesOptions
  ): Promise<CoinbaseExchangeRates | null> {
    const searchParameters = {}
    if (request.currency)
      Object.assign(searchParameters, { currency: request.currency })

    const response = await this.http.get<
      CoinbaseResponse<CoinbaseExchangeRates>
    >('v2/exchange-rates', { params: searchParameters })

    if (isCoinbaseSuccessResponse(response.data)) {
      return response.data.data
    }

    this.logger.error({ response }, 'Failed to get exchange rates')
    return null
  }
}
