import {
  AdminPaymentList,
  AdminPaymentListQuerystring,
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
  CreateBankAccount,
  CreateBankAccountResponse,
  CreateBidRequest,
  CreateCard,
  CreatePayment,
  CreateTransferPayment,
  CreateUserAccountRequest,
  CreateWalletAddress,
  DEFAULT_LOCALE,
  ExportCollectible,
  ExternalId,
  FindTransferByAddress,
  GetPaymentBankAccountStatus,
  GetPaymentCardStatus,
  Homepage,
  Locale,
  LocaleAndExternalId,
  MintPack,
  MintPackStatusResponse,
  OwnerExternalId,
  PackAuction,
  PackId,
  PacksByOwner,
  PacksByOwnerQuery,
  PackStatus,
  PackWithCollectibles,
  PackWithId,
  Payment,
  PaymentBankAccountInstructions,
  PaymentCard,
  PaymentCards,
  PublicAccount,
  PublicKey,
  PublishedPacks,
  PublishedPacksQuery,
  RedeemCode,
  SendBankAccountInstructions,
  SetWithCollection,
  SingleCollectibleQuerystring,
  ToPaymentBase,
  TransferPack,
  TransferPackStatusList,
  UpdatePaymentCard,
  UpdateUserAccount,
  Username,
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

  async exportCollectible(request: ExportCollectible) {
    return await this.http
      .post('collectibles/export', { json: request })
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

  async getPaymentById(paymentId: string) {
    return await this.http.get(`payments/${paymentId}`).json<Payment>()
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

  async createWalletAddress(json: CreateWalletAddress) {
    return await this.http
      .post('payments/wallets', { json })
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

  async getPayments(query: AdminPaymentListQuerystring) {
    const searchQuery = getPaymentsFilterQuery(query)
    return await this.http
      .get(`payments?${searchQuery}`)
      .json<AdminPaymentList>()
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

  //#region CollectibleAuction
  async getCollectibleAuction(collectibleAuctionId: string) {
    // TODO: Call API
    const today = new Date()
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const upcoming = {
      id: '6cb0fb67-51f3-42dc-b288-97a2d7759ef6',
      collectibleId: '8176f4c3-ca5e-4dfc-a195-a86a562b74de',
      reservePrice: 0,
      startAt: tomorrow.toISOString(),
      endAt: threeDaysFromNow.toISOString(),
      status: PackStatus.Upcoming,
    }
    const active = {
      id: '88c1e083-91d0-4c96-828e-cca4d5d01572',
      collectibleId: '3f214cd7-ff89-43f2-a768-580a3b85780d',
      reservePrice: 0,
      startAt: yesterday.toISOString(),
      endAt: threeDaysFromNow.toISOString(),
      status: PackStatus.Active,
    }
    const ended = {
      id: 'c62b78b0-149d-4b82-8df2-c2b8298923a7',
      collectibleId: 'e8ad7bbd-b2bf-4f2c-a925-e412cad5f521',
      reservePrice: 0,
      startAt: lastWeek.toISOString(),
      endAt: yesterday.toISOString(),
      status: PackStatus.Expired,
    }
    const collectibleAuctions = [upcoming, active, ended]
    return collectibleAuctions.find((ca) => ca.id === collectibleAuctionId)
  }

  async getCollectibleAuctionBids(collectibleAuctionId: string) {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const activeBid = {
      amount: 700,
      externalId: 'oa8RLiV8U8bGhVHI23iNrZHOU392',
      username: 'davidjmurphyjr',
      createdAt: yesterday.toISOString(),
      collectibleAuctionId: '88c1e083-91d0-4c96-828e-cca4d5d01572',
    }
    const collectibleAuctionBids = [activeBid]
    return collectibleAuctionBids.filter(
      (a) => a.collectibleAuctionId === collectibleAuctionId
    )
  }

  async getCollectiblesById(collectibleId: string) {
    const upcoming = {
      id: '8176f4c3-ca5e-4dfc-a195-a86a562b74de',
      templateId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      ownerExternalId: '52767fe4-2257-4bf3-86a3-dd756c6e7d2c',
    }
    const active = {
      id: '3f214cd7-ff89-43f2-a768-580a3b85780d',
      templateId: 'f085fff1-b9df-4ff0-810b-71d75997f518',
      ownerExternalId: '52767fe4-2257-4bf3-86a3-dd756c6e7d2c',
    }
    const ended = {
      id: 'e8ad7bbd-b2bf-4f2c-a925-e412cad5f521',
      templateId: '15486e91-6e0e-4883-9ea5-90d60f17413b',
      ownerExternalId: '52767fe4-2257-4bf3-86a3-dd756c6e7d2c',
    }
    const collectibles = [upcoming, active, ended]
    return collectibles.find((c) => c.id === collectibleId)
  }

  async getCollectibleTemplate(collectibleTemplateId: string) {
    const upcoming = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      image:
        'http://localhost:8055/assets/c3ec9cc0-ac80-4edc-bfeb-6ad74e40bf78',
      title: 'pack-dm title',
      subtitle: 'pack-dm subtitle',
      body: 'pack-dm body',
      available: 1,
      total: 1,
    }
    const active = {
      id: 'f085fff1-b9df-4ff0-810b-71d75997f518',
      image:
        'http://localhost:8055/assets/c3ec9cc0-ac80-4edc-bfeb-6ad74e40bf78',
      title: 'pack-dm title',
      subtitle: 'pack-dm subtitle',
      body: 'pack-dm body',
      available: 1,
      total: 1,
    }
    const ended = {
      id: '15486e91-6e0e-4883-9ea5-90d60f17413b',
      image:
        'http://localhost:8055/assets/c3ec9cc0-ac80-4edc-bfeb-6ad74e40bf78',
      title: 'pack-dm title',
      subtitle: 'pack-dm subtitle',
      body: 'pack-dm body',
      available: 1,
      total: 1,
    }
    const CollectibleTemplates = [upcoming, active, ended]
    return CollectibleTemplates.find((ct) => ct.id === collectibleTemplateId)
  }
  //#endregion
}
