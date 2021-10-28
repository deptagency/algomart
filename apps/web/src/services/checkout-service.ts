import {
  CreatePaymentCard,
  GetPaymentCardStatus,
  Payment,
  PaymentCards,
  PublicKey,
} from '@algomart/schemas'
import { getAuth } from 'firebase/auth'
import ky from 'ky'

import loadFirebase from '@/clients/firebase-client'
import { ExtractBodyType } from '@/middleware/validate-body-middleware'
import { validateCard, validatePurchase } from '@/utils/purchase-validation'
import { urls } from '@/utils/urls'

export type CreateCardRequest = ExtractBodyType<typeof validateCard>

export type CreatePaymentRequest = ExtractBodyType<typeof validatePurchase>

export interface CheckoutAPI {
  getCardStatus(cardId: string): Promise<GetPaymentCardStatus>
  getPayment(paymentId: string): Promise<Payment>
  getCards(): Promise<PaymentCards>
  getPublicKey(): Promise<PublicKey | null>
  createCard(request: CreateCardRequest): Promise<CreatePaymentCard | null>
  createPayment(request: CreatePaymentRequest): Promise<Payment | null>
}

export class CheckoutService implements CheckoutAPI {
  http: typeof ky

  constructor() {
    this.http = ky.create({
      throwHttpErrors: true,
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

  async getPublicKey(): Promise<PublicKey | null> {
    const response = await this.http.get(urls.api.v1.publicKey)
    if (response.ok) return await response.json()
    return null
  }

  async createCard(
    request: CreateCardRequest
  ): Promise<CreatePaymentCard | null> {
    const response = await this.http
      .post(urls.api.v1.createCard, {
        json: request,
      })
      .json<CreatePaymentCard>()

    return response.externalId ? response : null
  }

  async createPayment(request: CreatePaymentRequest): Promise<Payment | null> {
    const response = await this.http
      .post(urls.api.v1.createPayment, {
        json: request,
      })
      .json<Payment>()
    return response.id && response.packId ? response : null
  }

  async getPayment(paymentId: string): Promise<Payment> {
    const response = await this.http.get(
      `${urls.api.v1.getPayment}?paymentId=${paymentId}`
    )
    const payment = await response.json()
    return payment
  }

  async getCards(): Promise<PaymentCards> {
    const response = await this.http.get(urls.api.v1.getCardsByOwner)
    if (!response.ok) return []
    const { cards } = await response.json()
    return cards
  }

  async getCardStatus(cardId: string): Promise<GetPaymentCardStatus> {
    const response = await this.http.get(
      `${urls.api.v1.getCardStatus}?cardId=${cardId}`
    )
    const card = await response.json()
    return card
  }

  async updateCard(
    cardId: string,
    defaultCard: boolean
  ): Promise<{ success: boolean }> {
    const response = await this.http.patch(urls.api.v1.updateCard, {
      json: {
        cardId,
        default: defaultCard,
      },
    })
    return response.json()
  }

  async removeCard(cardId: string): Promise<{ success: boolean }> {
    const response = await this.http.delete(
      `${urls.api.v1.removeCard}?cardId=${cardId}`
    )
    return response.json()
  }
}

const checkoutService = new CheckoutService()

export default checkoutService
