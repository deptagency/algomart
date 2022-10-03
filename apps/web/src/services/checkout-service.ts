import {
  CircleBlockchainAddress,
  Countries,
  CreateCard,
  CreateCcPayment,
  CreateUsdcPayment,
  GetPaymentCardStatus,
  GetPaymentsMissingTransfersResponse,
  Payment,
  PaymentCard,
  PaymentCards,
  PublicKey,
  UserAccountTransfer,
  UserAccountTransfersQuery,
  UserAccountTransfersResponse,
} from '@algomart/schemas'
import ky from 'ky'

import { PAGE_SIZE } from '@/components/pagination/pagination'
import { invariant } from '@/utils/invariant'
import { setBearerToken } from '@/utils/ky-hooks'
import { apiFetcher } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export interface CheckoutAPI {
  getCardStatus(cardId: string): Promise<GetPaymentCardStatus>
  getPayment(paymentId: string): Promise<Payment>
  getCards(): Promise<PaymentCards>
  getCountries(): Promise<Countries | []>
  getPublicKey(): Promise<PublicKey | null>
  createCard(card: CreateCard): Promise<PaymentCard | null>
  createCcPayment(request: CreateCcPayment): Promise<Payment | null>
  createUsdcPayment(request: CreateUsdcPayment): Promise<Payment | null>
}

export class CheckoutService implements CheckoutAPI {
  http: typeof ky
  private static _instance: CheckoutService

  static get instance() {
    return this._instance || (this._instance = new CheckoutService())
  }

  constructor() {
    invariant(
      typeof window !== 'undefined',
      'CheckoutService must be used in the browser'
    )
    this.http = ky.create({
      throwHttpErrors: true,
      timeout: 10_000,
      hooks: {
        beforeRequest: [setBearerToken],
      },
    })
  }

  async getPublicKey(): Promise<PublicKey | null> {
    try {
      const publicKeyRecord = await apiFetcher().get<PublicKey>(
        urls.api.payments.publicKey
      )
      return publicKeyRecord
    } catch {
      return null
    }
  }

  async getCountries(language?: string): Promise<Countries | []> {
    return apiFetcher().get(
      urlFor(urls.api.application.countries, null, { language })
    )
  }

  async createCcPayment(request: CreateCcPayment): Promise<Payment | null> {
    const payment = await apiFetcher().post<Payment>(
      urls.api.payments.ccPayment,
      {
        json: request,
      }
    )
    return payment.id ? payment : null
  }

  async createUsdcPayment(request: CreateUsdcPayment): Promise<Payment | null> {
    const payment = await apiFetcher().post<Payment>(
      urls.api.payments.usdcPayment,
      {
        json: request,
      }
    )
    return payment.id ? payment : null
  }

  async createWalletAddress() {
    return await apiFetcher().post<CircleBlockchainAddress>(
      urls.api.payments.wallets
    )
  }

  async getPayment(paymentId: string): Promise<Payment> {
    const payment = await apiFetcher().get<Payment>(
      urlFor(urls.api.payments.payment, { paymentId })
    )
    return payment as Payment
  }

  async getUserAccountTransferByPaymentId(
    paymentId: string
  ): Promise<UserAccountTransfer | null> {
    try {
      const transfer = await apiFetcher().get<UserAccountTransfer>(
        urlFor(urls.api.payments.paymentTransfer, { paymentId })
      )
      return transfer
    } catch (error) {
      if (error?.response?.status === 404) {
        return null
      } else {
        throw error
      }
    }
  }

  async getUserAccountTransferByEntityId(
    entityId: string
  ): Promise<UserAccountTransfer | null> {
    try {
      const transfer = await apiFetcher().get<UserAccountTransfer>(
        urlFor(urls.api.transfers.byEntityId, { entityId })
      )
      return transfer
    } catch (error) {
      if (error?.response?.status === 404) {
        return null
      } else {
        throw error
      }
    }
  }

  async getUserAccountTransferById(
    id: string
  ): Promise<UserAccountTransfer | null> {
    try {
      const transfer = await apiFetcher().get<UserAccountTransfer>(
        urlFor(urls.api.transfers.getById, { id })
      )
      return transfer
    } catch {
      return null
    }
  }

  async searchUserAccountTransfers(
    query: Omit<UserAccountTransfersQuery, 'userExternalId'>
  ): Promise<UserAccountTransfersResponse> {
    try {
      return await apiFetcher().get<UserAccountTransfersResponse>(
        urlFor(urls.api.transfers.search, null, {
          ...query,
          pageSize: query.pageSize || PAGE_SIZE,
        })
      )
    } catch {
      return null
    }
  }

  async getPaymentsMissingTransfers(): Promise<GetPaymentsMissingTransfersResponse> {
    try {
      const payments =
        await apiFetcher().get<GetPaymentsMissingTransfersResponse>(
          urls.api.payments.missingTransfers
        )
      return payments
    } catch {
      return null
    }
  }

  //#region cards
  async createCard(card: CreateCard): Promise<PaymentCard | null> {
    return await apiFetcher().post(urls.api.payments.cards, {
      json: card,
    })
  }

  async getCards(): Promise<PaymentCards> {
    const response = await apiFetcher().get<PaymentCards>(
      urls.api.payments.cards
    )
    return response
  }

  async getCardStatus(cardId: string): Promise<GetPaymentCardStatus> {
    let cardStatus = null
    try {
      cardStatus = await apiFetcher().get<GetPaymentCardStatus>(
        urlFor(urls.api.payments.cardStatus, { cardId })
      )
    } catch (error) {
      if (error?.response?.status === 404) {
        return null
      }
      throw error
    }
    return cardStatus
  }

  async updateCard(
    cardId: string,
    defaultCard: boolean
  ): Promise<{ success: boolean }> {
    let success = true
    try {
      await apiFetcher().patch(urlFor(urls.api.payments.card, { cardId }), {
        json: { default: defaultCard },
      })
    } catch {
      success = false
    }
    return { success }
  }

  async removeCard(cardId: string): Promise<{ success: boolean }> {
    let success = true
    try {
      await apiFetcher().delete(urlFor(urls.api.payments.card, { cardId }))
    } catch {
      success = false
    }
    return { success }
  }
  //#endregion
}
