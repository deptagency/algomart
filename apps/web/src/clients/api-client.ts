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
import ky, { HTTPError } from 'ky'
import pino from 'pino'

import { Environment } from '@/environment'
import {
  getCollectiblesFilterQuery,
  getPacksByOwnerFilterQuery,
  getPaymentsFilterQuery,
  getPublishedPacksFilterQuery,
} from '@/utils/filters'
import { logger } from '@/utils/logger'

export class ApiClient {
  http: typeof ky
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
    this.logger = logger.child({ context: 'ApiClient' })
    this.http = ky.create({
      prefixUrl,
      timeout: defaultTimeout,
      headers: { Authorization: `Bearer ${apiKey}` },
    })
  }

  //#region User Accounts
  async createAccount(json: CreateUserAccountRequest) {
    return await this.http.post('accounts', { json }).json<PublicAccount>()
  }

  async updateAccount(request: UpdateUserAccount & ExternalId) {
    const { externalId, ...json } = request
    return await this.http
      .patch(`accounts/${externalId}`, { json })
      .then((response) => response.ok)
  }

  async getAccountByExternalId(externalId: string) {
    return await this.http
      .get(`accounts/${externalId}`)
      .json<PublicAccount>()
      .catch((error) => {
        if (error instanceof HTTPError && error.response.status === 404) {
          return null
        }
        throw error
      })
  }

  async getAccountByUsername(username: string) {
    return await this.http
      .get('accounts', {
        searchParams: { username },
      })
      .json<PublicAccount>()
      .catch((error) => {
        if (error instanceof HTTPError && error.response.status === 404) {
          return null
        }
        throw error
      })
  }

  async verifyPassphrase(externalId: string, passphrase: string) {
    return await this.http
      .post(`accounts/${externalId}/verify-passphrase`, {
        json: { passphrase },
      })
      .json<{ isValid: boolean }>()
  }

  async verifyUsername(json: Username) {
    return await this.http
      .post('accounts/verify-username', { json })
      .json<{ isAvailable: boolean }>()
  }
  //#endregion

  //#region Collectibles
  async getCollectiblesByAlgoAddress(
    algoAddress: string,
    query: CollectiblesByAlgoAddressQuerystring
  ): Promise<CollectibleListWithTotal> {
    return await this.http
      .get(`collectibles/address/${algoAddress}`, {
        searchParams: query,
      })
      .json<CollectibleListWithTotal>()
  }

  async getCollectiblesByUser(
    query: CollectibleListQuerystring
  ): Promise<CollectibleListWithTotal> {
    const searchQuery = getCollectiblesFilterQuery(query)
    return await this.http
      .get(`collectibles?${searchQuery}`)
      .json<CollectibleListWithTotal>()
  }

  async getShowcaseByUser(
    query: CollectibleShowcaseQuerystring
  ): Promise<CollectibleListShowcase | null> {
    return await this.http
      .get('collectibles/showcase', { searchParams: query })
      .json<CollectibleListShowcase>()
      .catch((error) => {
        if (error instanceof HTTPError && error.response.status === 404) {
          return null
        }
        throw error
      })
  }

  async addShowcase(request: CollectibleShowcaseQuerystring & CollectibleId) {
    return await this.http
      .post('collectibles/showcase', {
        searchParams: {
          ownerUsername: request.ownerUsername,
        },
        json: { collectibleId: request.collectibleId },
      })
      .then((response) => response.ok)
  }

  async removeShowcase(
    request: CollectibleShowcaseQuerystring & CollectibleId
  ) {
    return await this.http
      .delete('collectibles/showcase', {
        searchParams: {
          ownerUsername: request.ownerUsername,
        },
        json: { collectibleId: request.collectibleId },
      })
      .then((response) => response.ok)
  }

  async initializeExportCollectible(request: InitializeTransferCollectible) {
    return await this.http
      .post('collectibles/export', { json: request })
      .json<TransferCollectibleResult>()
  }

  async exportCollectible(request: TransferCollectible) {
    return await this.http
      .post('collectibles/export/sign', { json: request })
      .json<{ txId: string }>()
  }

  async initializeImportCollectible(request: InitializeTransferCollectible) {
    return await this.http
      .post('collectibles/import', { json: request })
      .json<TransferCollectibleResult>()
  }

  async importCollectible(request: TransferCollectible) {
    return await this.http
      .post('collectibles/import/sign', { json: request })
      .json<{ txId: string }>()
  }

  async getCollectible(request: SingleCollectibleQuerystring) {
    return await this.http
      .get('collectibles/find-one', { searchParams: request })
      .json<CollectibleWithDetails>()
  }
  //#endregion

  //#region Payments
  async createPayment(json: CreatePayment) {
    return await this.http.post('payments', { json }).json<Payment>()
  }

  async getPaymentById(paymentId: string, isExternalId: boolean) {
    const searchParams = new URLSearchParams()
    if (isExternalId) searchParams.set('isExternalId', isExternalId.toString())
    return await this.http
      .get(`payments/${paymentId}`, { searchParams })
      .json<Payment>()
  }

  async getPublicKey() {
    return await this.http
      .get('payments/encryption-public-key')
      .json<PublicKey>()
  }

  async createBankAccount(json: CreateBankAccount) {
    return await this.http
      .post('payments/bank-accounts', { json })
      .json<CreateBankAccountResponse>()
  }

  async createCard(json: CreateCard) {
    return await this.http.post('payments/cards', { json }).json<PaymentCard>()
  }

  async createTransferPurchase(json: CreateTransferPayment) {
    return await this.http.post('payments/transfers', { json }).json<Payment>()
  }

  async createWalletAddress() {
    return await this.http
      .post('payments/wallets')
      .json<CircleBlockchainAddress>()
  }

  async getBankAddressInstructions(bankAccountId: string) {
    return await this.http
      .get(`payments/bank-accounts/${bankAccountId}/instructions`)
      .json<PaymentBankAccountInstructions>()
  }

  async getBankAddressStatus(bankAccountId: string) {
    return await this.http
      .get(`payments/bank-accounts/${bankAccountId}/status`)
      .json<GetPaymentBankAccountStatus>()
  }

  async getCardStatus(cardId: string) {
    return await this.http
      .get(`payments/cards/${cardId}/status`)
      .json<GetPaymentCardStatus>()
  }

  async getCards(filters: OwnerExternalId) {
    const searchParameters = new URLSearchParams()
    if (filters?.ownerExternalId)
      searchParameters.set('ownerExternalId', `${filters.ownerExternalId}`)
    return await this.http
      .get('payments/cards', { searchParams: searchParameters })
      .json<PaymentCards>()
  }

  async updateCardById(cardId: string, json: UpdatePaymentCard) {
    return await this.http
      .patch(`payments/cards/${cardId}`, { json })
      .then((response) => response.ok)
  }

  async removeCardById(cardId: string) {
    return await this.http
      .delete(`payments/cards/${cardId}`)
      .then((response) => response.ok)
  }

  async sendBankAddressInstructions(filters: SendBankAccountInstructions) {
    const searchParameters = new URLSearchParams()
    if (filters?.bankAccountId)
      searchParameters.set('bankAccountId', `${filters.bankAccountId}`)
    if (filters?.ownerExternalId)
      searchParameters.set('ownerExternalId', `${filters.ownerExternalId}`)
    return await this.http
      .get(`payments/bank-accounts/send`, { searchParams: searchParameters })
      .then((response) => response.ok)
  }

  async getTransferByAddress(query: FindTransferByAddress) {
    const searchParams = new URLSearchParams()
    if (query?.destinationAddress)
      searchParams.set('destinationAddress', query.destinationAddress)
    return await this.http
      .get('payments/transfers', { searchParams })
      .json<ToPaymentBase>()
      .catch(() => null)
  }

  async getPayments(query: PaymentsQuerystring) {
    const searchQuery = getPaymentsFilterQuery(query)
    return await this.http.get(`payments?${searchQuery}`).json<Payments>()
  }

  async getAdminPaymentById(paymentId: string) {
    return await this.http
      .get(`payments/${paymentId}?isAdmin=${true}`)
      .json<Payment>()
  }

  async getPaymentsByBankAccountId(bankAccountId: string) {
    return await this.http
      .get(`payments/bank-accounts/${bankAccountId}/payments`)
      .json<WirePayment[]>()
  }

  async updatePaymentById(paymentId: string, json: UpdatePayment) {
    return await this.http
      .patch(`payments/${paymentId}`, { json })
      .json<UpdatePayment>()
  }
  //#endregion

  //#region Packs
  async getPublishedPacks(query: PublishedPacksQuery) {
    const searchQuery = getPublishedPacksFilterQuery(query)
    return await this.http.get(`packs?${searchQuery}`).json<PublishedPacks>()
  }

  async getPacksByOwnerId(ownerExternalId: string, query: PacksByOwnerQuery) {
    const searchQuery = getPacksByOwnerFilterQuery(query)
    return await this.http
      .get(`packs/by-owner/${ownerExternalId}?${searchQuery}`)
      .json<PacksByOwner>()
  }

  async packWithCollectibles(request: Locale & PackId) {
    return await this.http
      .get(`packs/${request.packId}`, {
        searchParams: {
          locale: request.locale || DEFAULT_LOCALE,
        },
      })
      .json<PackWithCollectibles>()
  }

  async redeemablePack(request: RedeemCode & Locale) {
    return await this.http
      .get(`packs/redeemable/${request.redeemCode}`, {
        searchParams: {
          locale: request.locale || DEFAULT_LOCALE,
        },
      })
      .json<{ pack: PackWithId }>()
  }

  async claimPack(json: ClaimPack) {
    return await this.http.post('packs/claim', { json }).json<PackWithId>()
  }

  async claimFreePack(json: ClaimFreePack) {
    return await this.http
      .post('packs/claim/free', { json })
      .json<{ pack: PackWithId }>()
  }

  async claimRedeemPack(json: ClaimRedeemPack) {
    return await this.http
      .post('packs/claim/redeem', { json })
      .json<{ pack: PackWithId }>()
  }

  async mintPackStatus(params: MintPack) {
    return await this.http
      .get('packs/mint', { searchParams: params })
      .json<MintPackStatusResponse>()
  }

  async revokePack(json: RevokePack) {
    return await this.http
      .post('packs/revoke', { json })
      .then((response) => response.ok)
  }

  async transferPack(json: TransferPack) {
    return await this.http.post('packs/transfer', { json })
  }

  async transferPackStatus(packId: string): Promise<TransferPackStatusList> {
    return await this.http
      .get(`packs/transfer/${packId}`)
      .json<TransferPackStatusList>()
  }

  async untransferredPacks(params: LocaleAndExternalId): Promise<PacksByOwner> {
    return await this.http
      .get('packs/untransferred', { searchParams: params })
      .json<PacksByOwner>()
  }
  //#endregion

  //#region Bids & Auctions
  async getAuctionPack(templateId: string) {
    return await this.http
      .get(`packs/auction/${templateId}`)
      .json<PackAuction>()
  }

  async createPackBid(json: CreateBidRequest) {
    return await this.http
      .post('bids/pack', { json })
      .then((response) => response.ok)
  }

  //#endregion

  //#region Collections & Sets
  async getAllCollections(): Promise<{
    total: number
    collections: CollectionWithSets[]
  }> {
    return await this.http
      .get('collections')
      .json<{ total: number; collections: CollectionWithSets[] }>()
  }

  async getCollectionBySlug(slug: string): Promise<CollectionWithSets | null> {
    return await this.http.get(`collections/${slug}`).json<CollectionWithSets>()
  }

  async getSetBySlug(slug: string): Promise<SetWithCollection | null> {
    return await this.http.get(`sets/${slug}`).json<SetWithCollection>()
  }
  //#endregion

  //#region Homepage
  async getHomepage(locale: string) {
    return await this.http
      .get('homepage', {
        searchParams: {
          locale,
        },
      })
      .json<Homepage>()
  }
  //#endregion

  //#region Application
  async getCountries() {
    return await this.http.get('application/countries').json<Countries>()
  }
  //#endregion
}
