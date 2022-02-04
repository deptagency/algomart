import { LanguageList } from '@algomart/schemas'
import { getAuth } from 'firebase/auth'
import ky from 'ky'

import loadFirebase from '@/clients/firebase-client'
import { urls } from '@/utils/urls'

export interface LanguageAPI {
  getLanguages(): Promise<LanguageList>
}

export class LanguageService implements LanguageAPI {
  http: typeof ky

  constructor() {
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

  async getLanguages(): Promise<LanguageList> {
    const response = await this.http
      .get(urls.api.v1.getLanguages)
      .json<LanguageList>()

    return response
  }
}

const languageService: LanguageAPI = new LanguageService()

export default languageService
