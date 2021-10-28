import { getAuth } from 'firebase/auth'
import ky from 'ky'

import loadFirebase from '@/clients/firebase-client'
import { urls } from '@/utils/urls'
export interface AuthAPI {
  isUsernameAvailable(username: string): Promise<boolean>
  updateUsername(username: string): Promise<boolean>
  verifyPassphrase(externalId: string, passphrase: string): Promise<boolean>
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
      .json()
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

  async verifyPassphrase(
    externalId: string,
    passphrase: string
  ): Promise<boolean> {
    const { isValid } = await this.http
      .post(urls.api.v1.verifyPassphrase, {
        json: { externalId, passphrase },
      })
      .json()

    return isValid
  }
}

const authService: AuthAPI = new AuthService()

export default authService
