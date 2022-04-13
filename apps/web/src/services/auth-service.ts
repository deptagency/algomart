import { DEFAULT_CURRENCY, DEFAULT_LANG } from '@algomart/schemas'
import { getAuth } from 'firebase/auth'
import ky from 'ky'

import { setCurrencyCookie, setLanguageCookie } from '@/utils/cookies-web'
import { invariant } from '@/utils/invariant'
import { urls } from '@/utils/urls'

export interface AuthAPI {
  isUsernameAvailable(username: string): Promise<boolean>
  updateUsername(username: string): Promise<boolean>
  updateLanguage(language: string): Promise<boolean>
  updateCurrency(currency: string): Promise<boolean>
  verifyPassphrase(passphrase: string): Promise<boolean>
}

export class AuthService implements AuthAPI {
  http: typeof ky
  private static _instance: AuthService

  static get instance() {
    return this._instance || (this._instance = new AuthService())
  }

  constructor() {
    invariant(
      typeof window !== 'undefined',
      'AuthService must be used in the browser'
    )
    this.http = ky.create({
      throwHttpErrors: false,
      timeout: 10_000,
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

  async isUsernameAvailable(username: string): Promise<boolean> {
    const { isAvailable } = await this.http
      .post(urls.api.v1.verifyUsername, {
        json: { username },
      })
      .json<{ isAvailable: boolean }>()
    return isAvailable
  }

  /**
   *
   * @param language - language to update user's preference to
   */
  async updateLanguage(language = DEFAULT_LANG): Promise<boolean> {
    try {
      await this.http
        .put(urls.api.v1.updateLanguage, { json: { language } })
        .json()

      setLanguageCookie(language)

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
        .put(urls.api.v1.updateCurrency, { json: { currency } })
        .json()

      setCurrencyCookie(currency)

      return true
    } catch {
      return false
    }
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
}
