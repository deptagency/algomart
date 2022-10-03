import {
  BalanceAvailableForPayoutResponse,
  CollectibleBase,
  CollectibleQuery,
  CollectibleTemplateUniqueCodeQuery,
  CollectibleWithDetails,
  CollectionWithSets,
  CreateCcPayment,
  CreateUsdcPayment,
  DEFAULT_LANG,
  Faqs,
  InitializeTransferCollectible,
  InitiateUsdcPayoutRequest,
  Language,
  PackId,
  PackWithCollectibles,
  PackWithId,
  Payment,
  PublicAccount,
  PublishedPack,
  PublishedPacks,
  PublishedPacksQuery,
  PurchasePackWithCredits,
  RedeemCode,
  SendNewEmailVerification,
  SetWithCollection,
  TransferCollectible,
  TransferCollectibleResult,
  UserAccountTransfer,
  UserAccountTransfersQuery,
  UserAccountTransfersResponse,
} from '@algomart/schemas'
import { HttpTransport, invariant } from '@algomart/shared/utils'
import axios from 'axios'
import pino from 'pino'

import { AppConfig } from '@/config'
import {
  getCollectibleTemplateByUniqueCodeQuery,
  searchPublishedPacksQuery,
  searchUserAccountTransfersQuery,
} from '@/utils/filters'
import { createLogger } from '@/utils/logger'

const is404 = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404

export class ApiClient {
  http: HttpTransport
  logger: pino.Logger

  constructor(
    readonly prefixUrl: string,
    readonly token?: string,
    readonly defaultTimeout = 30_000
  ) {
    invariant(typeof window === 'undefined', 'Cannot use ApiClient in browser')

    this.logger = createLogger(AppConfig.logLevel, { context: 'ApiClient' })

    this.http = new HttpTransport({
      baseURL: prefixUrl,
      timeout: defaultTimeout,
      defaultHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    })
  }

  /**
   * Adds a rate limit key for this request. Should be set for all anonymous
   * requests to ensure the request is not incorrectly rate limited.
   * @param key Either a user's externalId, username, or their IP address
   * @returns The ApiClient instance
   */
  withRateLimitKey(key: string) {
    this.http.client.defaults.headers['x-algomart-client-key'] = key
    return this
  }

  //#region User Accounts
  async getAccountProfile(): Promise<PublicAccount | null> {
    return await this.http
      .get<PublicAccount>('accounts')
      .then(({ data }) => data)
      .catch((error) => {
        if (is404(error)) return null
        throw error
      })
  }

  async getAccountByUsername(username: string) {
    return await this.http
      .get<PublicAccount>(`accounts/${encodeURIComponent(username)}`)
      .then(({ data }) => data)
      .catch((error) => {
        if (is404(error)) return null
        throw error
      })
  }

  async getAccountByEmail(email: string) {
    return await this.http
      .get<PublicAccount>(`accounts/email/${encodeURIComponent(email)}`)
      .then(({ data }) => {
        return data
      })
      .catch((error) => {
        if (is404(error)) return null
        throw error
      })
  }

  async sendNewEmailVerification(json: SendNewEmailVerification) {
    return await this.http.post<string>(
      'accounts/send-new-email-verification',
      json
    )
  }

  // #endregion User Accounts

  //#region Collectibles
  async getCollectibleTemplateByUniqueCode(
    query: CollectibleTemplateUniqueCodeQuery
  ) {
    const searchQuery = getCollectibleTemplateByUniqueCodeQuery(query)
    return await this.http
      .get<CollectibleBase>(
        `collectibles/template/by-unique-code/${query.uniqueCode}?${searchQuery}`
      )
      .then(({ data }) => data)
  }

  async initializeExportCollectible(request: InitializeTransferCollectible) {
    return await this.http
      .post<TransferCollectibleResult>('collectibles/export', request)
      .then(({ data }) => data)
  }

  async exportCollectible(request: TransferCollectible) {
    return await this.http
      .post<{ txId: string }>('collectibles/export/sign', request)
      .then(({ data }) => data)
  }

  async initializeImportCollectible(request: InitializeTransferCollectible) {
    return await this.http
      .post<TransferCollectibleResult>('collectibles/import', request)
      .then(({ data }) => data)
  }

  async importCollectible(request: TransferCollectible) {
    return await this.http
      .post<{ txId: string }>('collectibles/import/sign', request)
      .then(({ data }) => data)
  }

  /**
   * Ensure you call this via ISR
   * @param request Params to fetch a collectible
   * @returns
   */
  async getCollectible(request: CollectibleQuery) {
    return await this.http
      .get<CollectibleWithDetails>('collectibles/find-one', {
        params: request,
      })
      .then(({ data }) => data)
      .catch((error) => {
        if (is404(error)) return null
        throw error
      })
  }
  //#endregion

  //#region Payments

  // purchase credits, pack, collectible with usdc
  async createCcPayment(json: CreateCcPayment) {
    return await this.http
      .post<Payment>('payments/cc-payment', json)
      .then(({ data }) => data)
  }

  // purchase credits, pack, collectible with usdc
  async createUsdcPayment(json: CreateUsdcPayment) {
    return await this.http
      .post<Payment>('payments/usdc-payment', json)
      .then(({ data }) => data)
  }

  // purchase pack with credits
  async purchasePackCreditsPayment(json: PurchasePackWithCredits) {
    return await this.http
      .post<UserAccountTransfer>('payments/purchase-pack-credits-payment', json)
      .then(({ data }) => data)
  }

  async initiateUsdcPayout(json: InitiateUsdcPayoutRequest) {
    return await this.http
      .post<UserAccountTransfer>('payouts/usdc', json)
      .then(({ data }) => data)
  }

  //#endregion

  //#region User Transfers
  async getUserAccountTransferById(transferId: string) {
    return await this.http
      .get<UserAccountTransfer>(`user-transfers/${transferId}`)
      .then(({ data }) => data)
      .catch(() => null)
  }

  async getUserAccountTransferByEntityId(entityId: string) {
    return await this.http
      .get<UserAccountTransfer>(`user-transfers/search/entity-id/${entityId}`)
      .then(({ data }) => {
        return data
      })
      .catch((error) => {
        if (is404(error)) return null
        else throw error
      })
  }

  async searchUserAccountTransfers(query: UserAccountTransfersQuery) {
    const searchQuery = searchUserAccountTransfersQuery(query)
    return await this.http
      .get<UserAccountTransfersResponse>(`user-transfers/search?${searchQuery}`)
      .then(({ data }) => data)
  }
  //#endregion

  // #region Payouts
  async getBalanceAvailableForPayout(): Promise<BalanceAvailableForPayoutResponse> {
    return await this.http
      .get<BalanceAvailableForPayoutResponse>('payouts/available-balance')
      .then(({ data }) => data)
      .catch(() => null)
  }
  // #endregion

  //#region Packs
  async searchPublishedPacks(query: PublishedPacksQuery) {
    const searchQuery = searchPublishedPacksQuery(query)
    return await this.http
      .get<PublishedPacks>(`packs/search?${searchQuery}`)
      .then(({ data }) => data)
  }

  async getPublishedPackBySlug(slug: string, language: string) {
    const searchQuery = searchPublishedPacksQuery({ language })
    return await this.http
      .get<PublishedPack>(`packs/by-slug/${slug}?${searchQuery}`)
      .then(({ data }) => data)
  }

  async packWithCollectibles(request: Language & PackId) {
    return await this.http
      .get<PackWithCollectibles>(`packs/${request.packId}`, {
        params: {
          language: request.language || DEFAULT_LANG,
        },
      })
      .then(({ data }) => data)
  }

  async redeemablePack(request: RedeemCode & Language) {
    return await this.http
      .get<{ pack: PackWithId }>(`packs/redeemable/${request.redeemCode}`, {
        params: {
          language: request.language || DEFAULT_LANG,
        },
      })
      .then(({ data }) => data)
  }
  //#endregion

  //#region Collections & Sets
  async getCollectionBySlug(
    slug: string,
    language: string
  ): Promise<CollectionWithSets | null> {
    return await this.http
      .get<CollectionWithSets>(`collections/${slug}`, {
        params: {
          language,
        },
      })
      .then(({ data }) => data)
  }

  async getSetBySlug(
    slug: string,
    language: string,
    rateLimitKey: string
  ): Promise<SetWithCollection | null> {
    return await this.http
      .get<SetWithCollection>(`sets/${slug}`, {
        params: {
          language: language || DEFAULT_LANG,
        },
      })
      .then(({ data }) => data)
  }
  //#endregion

  //#region Page
  async getDirectusPage(slug: string, language: string) {
    return await this.http
      .get('page', {
        params: {
          language,
          slug,
        },
      })
      .then(({ data }) => data)
  }
  //#endregion

  //#region FaqPage
  async getFaqs(language: string) {
    return await this.http
      .get<Faqs>('faqs', {
        params: {
          language,
        },
      })
      .then(({ data }) => data)
  }
  //#endregion
}
