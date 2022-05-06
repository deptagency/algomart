import ky from 'ky'

import { invariant } from '@/utils/invariant'
import { setBearerToken } from '@/utils/ky-hooks'
import { urls } from '@/utils/urls'

export interface BidAPI {
  addToPack(amount: number, packId: string): Promise<boolean>
}

export class BidService implements BidAPI {
  http: typeof ky
  private static _instance: BidService

  static get instance() {
    return this._instance || (this._instance = new BidService())
  }

  constructor() {
    invariant(
      typeof window !== 'undefined',
      'BidService must be used in the browser'
    )
    this.http = ky.create({
      timeout: 10_000,
      throwHttpErrors: false,
      hooks: {
        beforeRequest: [setBearerToken],
      },
    })
  }

  async addToPack(amount: number, packId: string): Promise<boolean> {
    const response = await this.http.post(urls.api.v1.createBidForPack, {
      json: { amount, packId },
    })

    return response.ok
  }
}
