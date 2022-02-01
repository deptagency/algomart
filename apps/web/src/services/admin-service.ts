import { AdminPermissions, Payment, UpdatePayment } from '@algomart/schemas'
import { getAuth } from 'firebase/auth'
import ky from 'ky'

import loadFirebase from '@/clients/firebase-client'
import { urls } from '@/utils/urls'

export interface AdminAPI {
  getLoggedInUserPermissions(): Promise<AdminPermissions>
  updatePayment(paymentId: string, json: UpdatePayment): Promise<Payment | null>
}

export class AdminService implements AdminAPI {
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
              // Force refresh of Firebase token on the first render
              const token = await auth.currentUser?.getIdToken(true)
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

  async getLoggedInUserPermissions(): Promise<AdminPermissions> {
    const response = await this.http
      .get(urls.api.v1.adminGetClaims)
      .json<AdminPermissions>()
    return response
  }

  async updatePayment(
    paymentId: string,
    json: UpdatePayment
  ): Promise<Payment | null> {
    const payment = await this.http
      .patch(urls.api.v1.admin.updatePayment, {
        json: { ...json, paymentId },
      })
      .json<Payment | null>()
    return payment
  }
}

const adminService: AdminAPI = new AdminService()

export default adminService
