import {
  ChainalysisResponse,
  ChainalysisSanctionedAddress,
  isChainalysisSuccessResponse,
} from '@algomart/schemas'
import { HttpTransport } from '@algomart/shared/utils'
import pino from 'pino'

export interface ChainalysisAdapterOptions {
  apiKey: string
  url: string
}

export class ChainalysisAdapter {
  http: HttpTransport
  logger: pino.Logger<unknown>

  constructor(
    readonly options: ChainalysisAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.http = new HttpTransport({
      baseURL: options.url,
      defaultHeaders: {
        'X-API-Key': options.apiKey,
      },
    })
  }

  async ping() {
    const response = await this.http.get('ping')
    return response.status === 200
  }

  async verifyBlockchainAddress(
    address: string
  ): Promise<ChainalysisSanctionedAddress[] | null> {
    const response = await this.http.get<
      ChainalysisResponse<{ identifications: ChainalysisSanctionedAddress[] }>
    >(`api/v1/address/${address}`)

    if (isChainalysisSuccessResponse(response.data)) {
      return response.data.identifications || []
    }

    this.logger.error({ response }, 'Failed to verify blockchain address')
    return null
  }
}
