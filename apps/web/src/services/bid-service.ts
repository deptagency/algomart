import { getAuth } from 'firebase/auth'
import ky from 'ky'

import loadFirebase from '@/clients/firebase-client'
import { invariant } from '@/utils/invariant'
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
        beforeRequest: [
          async (request) => {
            try {
              const auth = getAuth(loadFirebase())
              const token = await auth.currentUser?.getIdToken()
              if (token) {
                request.headers.set('Authorization', `Bearer ${token}`)
              }
            } catch {
              // ignore, firebase probably not initialized
            }
          },
        ],
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
