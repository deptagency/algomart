import {
  CircleBlockchainAddress,
  ClaimFreePack,
  ClaimPack,
  ClaimRedeemPack,
  CollectibleId,
  CollectibleListQuerystring,
  CollectibleListShowcase,
  CollectibleListWithTotal,
  CollectiblesByAlgoAddressQuerystring,
  CollectibleShowcaseQuerystring,
  CollectibleWithDetails,
  CollectionWithSets,
  Countries,
  CreateBankAccount,
  CreateBankAccountResponse,
  CreateBidRequest,
  CreateCard,
  CreatePayment,
  CreateTransferPayment,
  CreateUserAccountRequest,
  DEFAULT_LOCALE,
  ExternalId,
  FindTransferByAddress,
  GetPaymentBankAccountStatus,
  GetPaymentCardStatus,
  Homepage,
  InitializeTransferCollectible,
  Locale,
  LocaleAndExternalId,
  MintPack,
  MintPackStatusResponse,
  OwnerExternalId,
  PackAuction,
  PackId,
  PacksByOwner,
  PacksByOwnerQuery,
  PackWithCollectibles,
  PackWithId,
  Payment,
  PaymentBankAccountInstructions,
  PaymentCard,
  PaymentCards,
  Payments,
  PaymentsQuerystring,
  PublicAccount,
  PublicKey,
  PublishedPacks,
  PublishedPacksQuery,
  RedeemCode,
  RevokePack,
  SendBankAccountInstructions,
  SetWithCollection,
  SingleCollectibleQuerystring,
  ToPaymentBase,
  TransferCollectible,
  TransferCollectibleResult,
  TransferPack,
  TransferPackStatusList,
  UpdatePayment,
  UpdatePaymentCard,
  UpdateUserAccount,
  Username,
  WirePayment,
} from '@algomart/schemas'
import axios from 'axios'
import pino from 'pino'

import { Environment } from '@/environment'
import {
  getCollectiblesFilterQuery,
  getPacksByOwnerFilterQuery,
  getPaymentsFilterQuery,
  getPublishedPacksFilterQuery,
} from '@/utils/filters'
import { HttpTransport, validateStatus } from '@/utils/http-transport'
import { invariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

export class ApiClient {
  http: HttpTransport
  logger: pino.Logger
  private static _instance: ApiClient | undefined

  static get instance() {
    if (!this._instance)
      this._instance = new ApiClient(Environment.apiUrl, Environment.apiKey)
    return this._instance
  }

  constructor(
    readonly prefixUrl: string,
    readonly apiKey: string,
    readonly defaultTimeout = 30_000
  ) {
    invariant(
      typeof window === 'undefined',
      'ApiClient must not be used in browser'
    )
    this.logger = logger.child({ context: 'ApiClient' })
    this.http = new HttpTransport(prefixUrl, defaultTimeout, {
      Authorization: `Bearer ${apiKey}`,
    })
  }

  //#region User Accounts
  async createAccount(request: CreateUserAccountRequest) {
    return await this.http
      .post<PublicAccount>('accounts', request)
      .then((response) => response.data)
  }

  async updateAccount(request: UpdateUserAccount & ExternalId) {
    const { externalId, ...data } = request
    return await this.http
      .patch(`accounts/${externalId}`, data)
      .then((response) => validateStatus(response.status))
  }

  async getAccountByExternalId(externalId: string) {
    return await this.http
      .get<PublicAccount>(`accounts/${externalId}`)
      .then((response) => response.data)
      .catch((error) => {
        if (axios.isAxiosError(error) && error.response.status === 404) {
          return null
        }
        throw error
      })
  }

  async getAccountByUsername(username: string) {
    return await this.http
      .get<PublicAccount>('accounts', {
        params: { username },
      })
      .then((response) => response.data)
      .catch((error) => {
        if (axios.isAxiosError(error) && error.response.status === 404) {
          return null
        }
        throw error
      })
  }

  async verifyPassphrase(externalId: string, passphrase: string) {
    return await this.http
      .post<{ isValid: boolean }>(`accounts/${externalId}/verify-passphrase`, {
        passphrase,
      })
      .then((response) => response.data)
  }

  async verifyUsername(request: Username) {
    return await this.http
      .post<{ isAvailable: boolean }>('accounts/verify-username', request)
      .then((response) => response.data)
  }
  //#endregion

  //#region Collectibles
  async getCollectiblesByAlgoAddress(
    algoAddress: string,
    params: CollectiblesByAlgoAddressQuerystring
  ): Promise<CollectibleListWithTotal> {
    return await this.http
      .get<CollectibleListWithTotal>(`collectibles/address/${algoAddress}`, {
        params,
      })
      .then((response) => response.data)
  }

  async getCollectiblesByUser(
    query: CollectibleListQuerystring
  ): Promise<CollectibleListWithTotal> {
    const searchQuery = getCollectiblesFilterQuery(query)
    return await this.http
      .get<CollectibleListWithTotal>(`collectibles?${searchQuery}`)
      .then((response) => response.data)
  }

  async getShowcaseByUser(
    params: CollectibleShowcaseQuerystring
  ): Promise<CollectibleListShowcase | null> {
    return await this.http
      .get<CollectibleListShowcase>('collectibles/showcase', { params })
      .then((response) => response.data)
      .catch((error) => {
        if (axios.isAxiosError(error) && error.response.status === 404) {
          return null
        }
        throw error
      })
  }

  async addShowcase(request: CollectibleShowcaseQuerystring & CollectibleId) {
    return await this.http
      .post(
        'collectibles/showcase',
        { collectibleId: request.collectibleId },
        {
          params: {
            ownerUsername: request.ownerUsername,
          },
        }
      )
      .then((response) => validateStatus(response.status))
  }

  async removeShowcase(
    request: CollectibleShowcaseQuerystring & CollectibleId
  ) {
    return await this.http
      .delete(
        'collectibles/showcase',
        { collectibleId: request.collectibleId },
        {
          params: {
            ownerUsername: request.ownerUsername,
          },
        }
      )
      .then((response) => validateStatus(response.status))
  }

  async initializeExportCollectible(request: InitializeTransferCollectible) {
    return await this.http
      .post<TransferCollectibleResult>('collectibles/export', request)
      .then((response) => response.data)
  }

  async exportCollectible(request: TransferCollectible) {
    return await this.http
      .post<{ txId: string }>('collectibles/export/sign', request)
      .then((response) => response.data)
  }

  async initializeImportCollectible(request: InitializeTransferCollectible) {
    return await this.http
      .post<TransferCollectibleResult>('collectibles/import', request)
      .then((response) => response.data)
  }

  async importCollectible(request: TransferCollectible) {
    return await this.http
      .post<{ txId: string }>('collectibles/import/sign', request)
      .then((response) => response.data)
  }

  async getCollectible(request: SingleCollectibleQuerystring) {
    return await this.http
      .get<CollectibleWithDetails>('collectibles/find-one', { params: request })
      .then((response) => response.data)
  }
  //#endregion

  //#region Payments
  async createPayment(request: CreatePayment) {
    return await this.http
      .post<Payment>('payments', request)
      .then((response) => response.data)
  }

  async getPaymentById(paymentId: string, isExternalId: boolean) {
    return await this.http
      .get<Payment>(`payments/${paymentId}`, { params: { isExternalId } })
      .then((response) => response.data)
  }

  async getPublicKey() {
    return await this.http
      .get<PublicKey>('payments/encryption-public-key')
      .then((response) => response.data)
  }

  async createBankAccount(request: CreateBankAccount) {
    return await this.http
      .post<CreateBankAccountResponse>('payments/bank-accounts', request)
      .then((response) => response.data)
  }

  async createCard(request: CreateCard) {
    return await this.http
      .post<PaymentCard>('payments/cards', request)
      .then((response) => response.data)
  }

  async createTransferPurchase(request: CreateTransferPayment) {
    return await this.http
      .post<Payment>('payments/transfers', request)
      .then((response) => response.data)
  }

  async createWalletAddress() {
    return await this.http
      .post<CircleBlockchainAddress>('payments/wallets')
      .then((response) => response.data)
  }

  async getBankAddressInstructions(bankAccountId: string) {
    return await this.http
      .get<PaymentBankAccountInstructions>(
        `payments/bank-accounts/${bankAccountId}/instructions`
      )
      .then((response) => response.data)
  }

  async getBankAddressStatus(bankAccountId: string) {
    return await this.http
      .get<GetPaymentBankAccountStatus>(
        `payments/bank-accounts/${bankAccountId}/status`
      )
      .then((response) => response.data)
  }

  async getCardStatus(cardId: string) {
    return await this.http
      .get<GetPaymentCardStatus>(`payments/cards/${cardId}/status`)
      .then((response) => response.data)
  }

  async getCards(params?: OwnerExternalId) {
    return await this.http
      .get<PaymentCards>('payments/cards', { params })
      .then((response) => response.data)
  }

  async updateCardById(cardId: string, request: UpdatePaymentCard) {
    return await this.http
      .patch(`payments/cards/${cardId}`, request)
      .then((response) => validateStatus(response.status))
  }

  async removeCardById(cardId: string) {
    return await this.http
      .delete(`payments/cards/${cardId}`)
      .then((response) => validateStatus(response.status))
  }

  async sendBankAddressInstructions(params?: SendBankAccountInstructions) {
    return await this.http
      .get(`payments/bank-accounts/send`, { params })
      .then((response) => validateStatus(response.status))
  }

  async getTransferByAddress(params: FindTransferByAddress) {
    return await this.http
      .get<ToPaymentBase>('payments/transfers', { params })
      .then((response) => response.data)
      .catch(() => null)
  }

  async getPayments(query: PaymentsQuerystring) {
    const searchQuery = getPaymentsFilterQuery(query)
    return await this.http
      .get<Payments>(`payments?${searchQuery}`)
      .then((response) => response.data)
  }

  async getAdminPaymentById(paymentId: string) {
    return await this.http
      .get<Payment>(`payments/${paymentId}?isAdmin=${true}`)
      .then((response) => response.data)
  }

  async getPaymentsByBankAccountId(bankAccountId: string) {
    return await this.http
      .get<WirePayment[]>(`payments/bank-accounts/${bankAccountId}/payments`)
      .then((response) => response.data)
  }

  async updatePaymentById(paymentId: string, request: UpdatePayment) {
    return await this.http
      .patch<UpdatePayment>(`payments/${paymentId}`, request)
      .then((response) => response.data)
  }
  //#endregion

  //#region Packs
  async getPublishedPacks(query: PublishedPacksQuery) {
    const searchQuery = getPublishedPacksFilterQuery(query)
    return await this.http
      .get<PublishedPacks>(`packs?${searchQuery}`)
      .then((response) => response.data)
  }

  async getPacksByOwnerId(ownerExternalId: string, query: PacksByOwnerQuery) {
    const searchQuery = getPacksByOwnerFilterQuery(query)
    return await this.http
      .get<PacksByOwner>(`packs/by-owner/${ownerExternalId}?${searchQuery}`)
      .then((response) => response.data)
  }

  async packWithCollectibles(request: Locale & PackId) {
    return await this.http
      .get<PackWithCollectibles>(`packs/${request.packId}`, {
        params: {
          locale: request.locale || DEFAULT_LOCALE,
        },
      })
      .then((response) => response.data)
  }

  async redeemablePack(request: RedeemCode & Locale) {
    return await this.http
      .get<{ pack: PackWithId }>(`packs/redeemable/${request.redeemCode}`, {
        params: {
          locale: request.locale || DEFAULT_LOCALE,
        },
      })
      .then((response) => response.data)
  }

  async claimPack(request: ClaimPack) {
    return await this.http
      .post<PackWithId>('packs/claim', request)
      .then((response) => response.data)
  }

  async claimFreePack(request: ClaimFreePack) {
    return await this.http
      .post<{ pack: PackWithId }>('packs/claim/free', request)
      .then((response) => response.data)
  }

  async claimRedeemPack(request: ClaimRedeemPack) {
    return await this.http
      .post<{ pack: PackWithId }>('packs/claim/redeem', request)
      .then((response) => response.data)
  }

  async mintPackStatus(params: MintPack) {
    return await this.http
      .get<MintPackStatusResponse>('packs/mint', { params: params })
      .then((response) => response.data)
  }

  async revokePack(request: RevokePack) {
    return await this.http
      .post('packs/revoke', request)
      .then((response) => validateStatus(response.status))
  }

  async transferPack(request: TransferPack) {
    return await this.http.post('packs/transfer', request)
  }

  async transferPackStatus(packId: string): Promise<TransferPackStatusList> {
    return await this.http
      .get<TransferPackStatusList>(`packs/transfer/${packId}`)
      .then((response) => response.data)
  }

  async untransferredPacks(params: LocaleAndExternalId): Promise<PacksByOwner> {
    return await this.http
      .get<PacksByOwner>('packs/untransferred', { params: params })
      .then((response) => response.data)
  }
  //#endregion

  //#region Bids & Auctions
  async getAuctionPack(templateId: string) {
    return await this.http
      .get<PackAuction>(`packs/auction/${templateId}`)
      .then((response) => response.data)
  }

  async createPackBid(request: CreateBidRequest) {
    return await this.http
      .post('bids/pack', request)
      .then((response) => validateStatus(response.status))
  }

  //#endregion

  //#region Collections & Sets
  async getAllCollections(): Promise<{
    total: number
    collections: CollectionWithSets[]
  }> {
    return await this.http
      .get<{ total: number; collections: CollectionWithSets[] }>('collections')
      .then((response) => response.data)
  }

  async getCollectionBySlug(slug: string): Promise<CollectionWithSets | null> {
    return await this.http
      .get<CollectionWithSets>(`collections/${slug}`)
      .then((response) => response.data)
  }

  async getSetBySlug(slug: string): Promise<SetWithCollection | null> {
    return await this.http
      .get<SetWithCollection>(`sets/${slug}`)
      .then((response) => response.data)
  }
  //#endregion

  //#region Homepage
  async getHomepage(locale: string) {
    return await this.http
      .get<Homepage>('homepage', {
        params: {
          locale,
        },
      })
      .then((response) => response.data)
  }
  //#endregion

  //#region Application
  async getCountries() {
    return await this.http
      .get<Countries>('application/countries')
      .then((response) => response.data)
  }
  //#endregion
}
