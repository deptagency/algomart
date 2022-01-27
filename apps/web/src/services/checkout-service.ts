import {
  CreateBankAccountResponse,
  CreatePaymentCard,
  GetPaymentBankAccountStatus,
  GetPaymentCardStatus,
  Payment,
  PaymentBankAccountInstructions,
  PaymentCards,
  PaymentList,
  PaymentListQuerystring,
  PublicKey,
  ToPaymentBase,
} from '@algomart/schemas'
import { getAuth } from 'firebase/auth'
import ky from 'ky'

import loadFirebase from '@/clients/firebase-client'
import { ExtractBodyType } from '@/middleware/validate-body-middleware'
import { getPaymentsFilterQuery } from '@/utils/filters'
import {
  validateBankAccount,
  validateCard,
  validatePurchase,
  validateTransferPurchase,
} from '@/utils/purchase-validation'
import { urls } from '@/utils/urls'

export type CreateBankAccountRequest = ExtractBodyType<
  typeof validateBankAccount
>

export type CreateCardRequest = ExtractBodyType<typeof validateCard>

export type CreatePaymentRequest = ExtractBodyType<typeof validatePurchase>

export type CreateTransferRequest = ExtractBodyType<
  typeof validateTransferPurchase
>

export interface CheckoutAPI {
  getBankAccountInstructions(
    bankAccountId: string
  ): Promise<PaymentBankAccountInstructions>
  getBankAccountStatus(
    bankAccountId: string
  ): Promise<GetPaymentBankAccountStatus>
  getCardStatus(cardId: string): Promise<GetPaymentCardStatus>
  getPayments(query: PaymentListQuerystring): Promise<PaymentList>
  getPayment(paymentId: string): Promise<Payment>
  getCards(): Promise<PaymentCards>
  getPublicKey(): Promise<PublicKey | null>
  createBankAccount(
    request: CreateBankAccountRequest
  ): Promise<CreateBankAccountResponse | null>
  createCard(request: CreateCardRequest): Promise<CreatePaymentCard | null>
  createPayment(request: CreatePaymentRequest): Promise<Payment | null>
  createTransferPayment(request: CreateTransferRequest): Promise<Payment | null>
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

  async createBankAccount(
    request: CreateBankAccountRequest
  ): Promise<CreateBankAccountResponse | null> {
    const response = await this.http
      .post(urls.api.v1.createBankAccount, {
        json: request,
      })
      .json<CreateBankAccountResponse>()

    return response.id ? response : null
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

  async createTransferPayment(
    request: CreateTransferRequest
  ): Promise<Payment | null> {
    const response = await this.http
      .post(urls.api.v1.createTransfer, {
        json: request,
      })
      .json<Payment>()
    return response.id && response.packId ? response : null
  }

  async getPayments(query: PaymentListQuerystring): Promise<PaymentList> {
    const searchQuery = getPaymentsFilterQuery(query)
    return await this.http
      .get(`${urls.api.v1.listPayments}?${searchQuery}`)
      .json<PaymentList>()
  }

  async getPayment(paymentId: string): Promise<Payment> {
    const response = await this.http.get(
      `${urls.api.v1.getPayment}?paymentId=${paymentId}`
    )
    const payment = await response.json()
    return payment
  }

  async getTransferByAddress(address: string): Promise<ToPaymentBase | null> {
    try {
      const response = await this.http.get(
        `${urls.api.v1.getTransfer}?destinationAddress=${address}`
      )
      return await response.json()
    } catch {
      // If transfer wasn't found, return null
      return null
    }
  }

  async getCards(): Promise<PaymentCards> {
    const response = await this.http.get(urls.api.v1.getCardsByOwner)
    if (!response.ok) return []
    const { cards } = await response.json()
    return cards
  }

  async getBankAccountInstructions(
    bankAccountId: string
  ): Promise<PaymentBankAccountInstructions> {
    const response = await this.http.get(
      `${urls.api.v1.getBankAccountInstructions}?bankAccountId=${bankAccountId}`
    )
    const bankAccount = await response.json()
    return bankAccount
  }

  async getBankAccountStatus(
    bankAccountId: string
  ): Promise<GetPaymentBankAccountStatus> {
    const response = await this.http.get(
      `${urls.api.v1.getBankAccountStatus}?bankAccountId=${bankAccountId}`
    )
    const bankAccount = await response.json()
    return bankAccount
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
