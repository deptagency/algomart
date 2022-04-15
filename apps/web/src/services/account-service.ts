import { getAuth } from 'firebase/auth'
import ky from 'ky'

import { invariant } from '@/utils/invariant'
import { urls } from '@/utils/urls'

export interface AccountsAPI {
  createVerificationSession(): Promise<{ clientSecret: string }>
}

export class AccountsService implements AccountsAPI {
  http: typeof ky
  private static _instance: AccountsService

  static get instance() {
    return this._instance || (this._instance = new AccountsService())
  }

  constructor() {
    invariant(
      typeof window !== 'undefined',
      'AccountsService must be used in the browser'
    )
    this.http = ky.create({
      timeout: 10_000,
      throwHttpErrors: false,
      hooks: {
        beforeRequest: [
          async (request) => {
            try {
              const auth = getAuth()
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

  async createVerificationSession(): Promise<{ clientSecret: string }> {
    const response = await this.http
      .post(urls.api.v1.kycVerification, {
        json: { type: 'document' },
      })
      .json<{ clientSecret: string }>()

    return response
  }
}
