import { DEFAULT_CURRENCY, DEFAULT_LANG } from '@algomart/schemas'

import { setCurrencyCookie, setLanguageCookie } from '@/utils/cookies-web'
import { invariant } from '@/utils/invariant'
import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

export interface AuthAPI {
  updateUsername(username: string): Promise<unknown>
  updateEmail(username: string): Promise<unknown>
  updateLanguage(language: string): Promise<boolean>
  updateCurrency(currency: string): Promise<boolean>
  updateAge(age: number): Promise<boolean>
}

export class AuthService implements AuthAPI {
  private static _instance: AuthService

  static get instance() {
    return this._instance || (this._instance = new AuthService())
  }

  constructor() {
    invariant(
      typeof window !== 'undefined',
      'AuthService must be used in the browser'
    )
  }

  /**
   *
   * @param language - language to update user's preference to
   */
  async updateLanguage(language = DEFAULT_LANG): Promise<boolean> {
    try {
      await apiFetcher().patch(urls.api.accounts.base, { json: { language } })
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
      await apiFetcher().patch(urls.api.accounts.base, { json: { currency } })
      setCurrencyCookie(currency)

      return true
    } catch {
      return false
    }
  }

  async updateUsername(username: string): Promise<unknown> {
    return await apiFetcher().patch(urls.api.accounts.base, {
      json: { username },
    })
  }

  /**
   *
   * @param age - age to update user's preference to
   */
  async updateAge(age: number): Promise<boolean> {
    try {
      await apiFetcher().patch(urls.api.accounts.base, { json: { age } })
      return true
    } catch {
      return false
    }
  }

  /**
   *
   * @param email - email to update user's preference to
   */
  async updateEmail(email: string): Promise<unknown> {
    return await apiFetcher().patch(urls.api.accounts.base, {
      json: { email },
    })
  }
}
