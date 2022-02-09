import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@algomart/schemas'
import { getAuth } from 'firebase/auth'
import ky from 'ky'

import loadFirebase from '@/clients/firebase-client'
import { urls } from '@/utils/urls'
export interface AuthAPI {
  isUsernameAvailable(username: string): Promise<boolean>
  updateUsername(username: string): Promise<boolean>
  verifyPassphrase(passphrase: string): Promise<boolean>
  updateLanguage(locale: string): Promise<boolean>
  updateCurrency(currency: string): Promise<boolean>
}

export class AuthService implements AuthAPI {
  http: typeof ky

  constructor() {
    this.http = ky.create({
      throwHttpErrors: false,
      timeout: 10_000,
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

  async isUsernameAvailable(username: string): Promise<boolean> {
    const { isAvailable } = await this.http
      .post(urls.api.v1.verifyUsername, {
        json: { username },
      })
      .json<{ isAvailable: boolean }>()
    return isAvailable
  }

  async updateUsername(username: string): Promise<boolean> {
    try {
      await this.http
        .put(urls.api.v1.updateUsername, { json: { username } })
        .json()
      return true
    } catch {
      return false
    }
  }

  async verifyPassphrase(passphrase: string): Promise<boolean> {
    const { isValid } = await this.http
      .post(urls.api.v1.verifyPassphrase, {
        json: { passphrase },
      })
      .json<{ isValid: boolean }>()

    return isValid
  }

  /**
   *
   * @param locale - locale to update user's preference to
   */
  async updateLanguage(locale = DEFAULT_LOCALE): Promise<boolean> {
    try {
      await this.http
        .put(urls.api.v1.updateLanguage, { json: { locale } })
        .json()
      return true
    } catch {
      return false
    }
  }

  /**
   *
   * @param currency - currency to update user's preference to
   */
  async updateCurrency(currency = DEFAULT_CURRENCY): Promise<boolean> {
    try {
      await this.http
        .put(urls.api.v1.updateLanguage, { json: { currency } })
        .json()
      return true
    } catch {
      return false
    }
  }
}

const authService: AuthAPI = new AuthService()

export default authService
