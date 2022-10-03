import {
  CoinbaseExchangeRates,
  CoinbaseExchangeRatesOptions,
  CoinbaseResponse,
  isCoinbaseSuccessResponse,
} from '@algomart/schemas'
import { HttpTransport } from '@algomart/shared/utils'
import pino from 'pino'

interface CoinbaseAdapterOptions {
  url: string
}

export class CoinbaseAdapter {
  http: HttpTransport
  logger: pino.Logger<unknown>

  constructor(
    readonly options: CoinbaseAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.http = new HttpTransport({
      baseURL: options.url,
    })
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
