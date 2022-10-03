import { HttpTransport } from '@algomart/shared/utils'
import pino from 'pino'

export interface IpGeolocationAdapterOptions {
  apiKey: string
  url: string
}

export interface IPGeolocationResponse {
  ip: string
  continent_code: string
  continent_name: string
  country_code2: string
  country_code3: string
  country_name: string
  country_capital: string
  state_prov: string
  district: string
  city: string
  zipcode: string
  latitude: string
  longitude: string
  is_eu: boolean
  calling_code: string
  country_tld: string
  languages: string
  country_flag: string
  geoname_id: string
  isp: string
  connection_type: string
  organization: string
  currency: {
    code: string
    name: string
    symbol: string
  }
  time_zone: {
    name: string
    offset: number
    current_time: string
    current_time_unix: number
    is_dst: boolean
    dst_savings: number
  }
}

export class IpGeolocationAdapter {
  http: HttpTransport
  logger: pino.Logger<unknown>

  constructor(
    readonly options: IpGeolocationAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.http = new HttpTransport({
      baseURL: options.url,
    })
  }

  async getCountryCodeByIpAddress(ipAddress: string) {
    try {
      const { data } = await this.http.get<IPGeolocationResponse>('/', {
        params: {
          apiKey: this.options.apiKey,
          ip: ipAddress,
        },
      })
      if (data.country_code3) {
        return data.country_code3
      }
      return null
    } catch (error) {
      this.logger.error(error, 'Failed to lookup IP address')
      return null
    }
  }
}
