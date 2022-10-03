import {
  CircleBlockchainAddress,
  CircleCard,
  CircleCardStatus,
  CircleCreateBlockchainAddress,
  CircleCreateCard,
  CircleCreatePayment,
  CircleCreateWallet,
  CircleCreateWalletTransferPayoutRequest,
  CircleCreateWalletTransferRequest,
  CircleCreateWalletTransferResponse,
  CircleCreateWireBankAccountRequest,
  CircleCreateWirePayoutRequest,
  CircleNotificationSubscription,
  CirclePaymentCancelReason,
  CirclePaymentResponse,
  CirclePaymentStatus,
  CirclePayout,
  CirclePublicKey,
  CircleResponse,
  CircleTransfer,
  CircleTransferChainType,
  CircleTransferSourceType,
  CircleTransferStatus,
  CircleWallet,
  CircleWireBankAccount,
  CircleWireInstructions,
  isCircleSuccessResponse,
  PaymentCardStatus,
  PaymentStatus,
  PublicKey,
  ToPaymentBase,
  ToPaymentCardBase,
} from '@algomart/schemas'
import { HttpResponse, HttpTransport, invariant } from '@algomart/shared/utils'
import parseLinkHeader from 'parse-link-header'
import pino from 'pino'

export interface CircleAdapterOptions {
  url: string
  apiKey: string
}

function toPublicKeyBase(data: CirclePublicKey): PublicKey {
  return {
    keyId: data.keyId,
    publicKey: data.publicKey,
  }
}

function toCardStatus(status: CircleCardStatus): PaymentCardStatus {
  return {
    [CircleCardStatus.Complete]: PaymentCardStatus.Complete,
    [CircleCardStatus.Failed]: PaymentCardStatus.Failed,
    [CircleCardStatus.Pending]: PaymentCardStatus.Pending,
  }[status]
}

function toCardBase(response: CircleCard): ToPaymentCardBase {
  return {
    countryCode: response.billingDetails.country,
    expirationMonth: response.expMonth
      ? `${response.expMonth}`.padStart(2, '0')
      : undefined,
    expirationYear: response.expYear ? `${response.expYear}` : undefined,
    externalId: response.id,
    network: response.network,
    lastFour: response.last4,
    status: toCardStatus(response.status),
    error: response.errorCode,
  }
}

export function toPaymentStatus(
  status: CirclePaymentStatus | CircleTransferStatus
): PaymentStatus {
  return (
    {
      [CirclePaymentStatus.ActionRequired]: PaymentStatus.ActionRequired,
      [CirclePaymentStatus.Confirmed]: PaymentStatus.Confirmed,
      [CirclePaymentStatus.Failed]: PaymentStatus.Failed,
      [CirclePaymentStatus.Pending]: PaymentStatus.Pending,
      [CirclePaymentStatus.Paid]: PaymentStatus.Paid,

      [CircleTransferStatus.Pending]: PaymentStatus.Pending,
      [CircleTransferStatus.Failed]: PaymentStatus.Failed,
      [CircleTransferStatus.Complete]: PaymentStatus.Paid,
      [CircleTransferStatus.Running]: PaymentStatus.Pending,
    }[status] || PaymentStatus.Pending
  )
}

function isPayment(
  response: CirclePaymentResponse | CircleTransfer
): response is CirclePaymentResponse {
  const payment = response as CirclePaymentResponse
  return payment.verification !== undefined
}

export function isUsdcCreditPurchaseFromAlgoWallet(transfer: CircleTransfer) {
  return (
    transfer.source.type === CircleTransferSourceType.blockchain &&
    transfer.source.chain === CircleTransferChainType.ALGO
  )
}

export function toPaymentBase(
  response: CirclePaymentResponse | CircleTransfer
): ToPaymentBase {
  return {
    externalId: response.id,
    amount: response.amount.amount,
    sourceId: response.source.id,
    status: toPaymentStatus(response.status),
    error: response.errorCode,
    action: isPayment(response)
      ? response.requiredAction?.redirectUrl
      : undefined,
  }
}

export function mapPaymentStatusToTransferStatus(
  status: PaymentStatus
): CircleTransferStatus {
  return (
    {
      [PaymentStatus.Pending]: CircleTransferStatus.Pending,
      [PaymentStatus.Failed]: CircleTransferStatus.Failed,
      [PaymentStatus.Paid]: CircleTransferStatus.Complete,
    }[status] ?? CircleTransferStatus.Pending
  )
}

export class CircleAdapter {
  http: HttpTransport
  logger: pino.Logger<unknown>
  masterWalletId: string

  constructor(
    readonly options: CircleAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.http = new HttpTransport({
      baseURL: options.url,
      defaultHeaders: {
        Authorization: `Bearer ${options.apiKey}`,
      },
      throwOnHttpError: false,
    })

    this.testConnection()
  }

  async getMasterWalletId(): Promise<string> {
    const response = await this.http.get<
      CircleResponse<{ payments: { masterWalletId: string } }>
    >('v1/configuration')

    invariant(
      isCircleSuccessResponse(response.data),
      'Failed to get Circle master wallet ID'
    )

    this.logger.info(
      `Circle master wallet ID: ${response.data.data.payments.masterWalletId}`
    )

    return response.data.data.payments.masterWalletId
  }

  async testConnection() {
    try {
      // The Circle master wallet ID never changes, so we can fetch it and cache it for later use
      this.masterWalletId = await this.getMasterWalletId()
      this.logger.info('Successfully connected to Circle')
    } catch (error) {
      this.logger.error(error, 'Failed to connect to Circle')
    }
  }

  async ping() {
    const response = await this.http.get('ping')
    return response.status === 200
  }

  /**
   * Get a list of all Circle notifications subscriptions
   *
   * @see https://developers.circle.com/reference/listsubscriptions
   * @returns All notification subscriptions
   */
  async getNotificationSubscriptions() {
    const response = await this.http.get<
      CircleResponse<CircleNotificationSubscription[]>
    >('v1/notifications/subscriptions')

    if (isCircleSuccessResponse(response.data)) {
      return response.data.data
    }

    return []
  }

  /**
   * Creates a new Circle notification subscription (Circle uses AWS SNS)
   *
   * This might fail if we've already hit our limit for this Circle account:
   *
   * - Sandbox: up to three can be created
   * - Production: only one can be created
   *
   * @see https://developers.circle.com/reference/subscribe
   * @param endpoint URL to send notifications to
   * @returns The pending notification subscription
   */
  async createNotificationSubscription(endpoint: string) {
    const response = await this.http.post<
      CircleResponse<CircleNotificationSubscription>
    >('v1/notifications/subscriptions', { endpoint })
    if (isCircleSuccessResponse(response.data)) {
      return response.data.data
    }
    return null
  }

  /**
   * Can only delete confirmed notification subscriptions
   *
   * @see https://developers.circle.com/reference/unsubscribe
   * @param id The ID of the notification subscription to delete
   * @returns True if the subscription was deleted, false if it didn't exist or failed to delete
   */
  async deleteNotificationSubscription(id: string) {
    const response = await this.http.delete<CircleResponse>(
      `v1/notifications/subscriptions/${id}`
    )
    if (isCircleSuccessResponse(response.data)) {
      return true
    }
    return false
  }

  async getPublicKey(): Promise<PublicKey | null> {
    const response = await this.http.get<CircleResponse<CirclePublicKey>>(
      'v1/encryption/public'
    )

    if (isCircleSuccessResponse(response.data)) {
      return toPublicKeyBase(response.data.data)
    }

    this.logger.error({ response }, 'Failed to get public key')
    return null
  }

  async createBlockchainAddress(
    request: CircleCreateBlockchainAddress
  ): Promise<CircleBlockchainAddress | null> {
    const response = await this.http.post<
      CircleResponse<CircleBlockchainAddress>
    >(`v1/wallets/${request.walletId}/addresses`, {
      idempotencyKey: request.idempotencyKey,
      currency: 'USD',
      chain: 'ALGO',
    })

    if (isCircleSuccessResponse(response.data)) {
      return response.data.data
    }

    this.logger.error({ response }, 'Failed to create blockchain address')
    return null
  }

  async createPaymentCard(
    request: CircleCreateCard
  ): Promise<ToPaymentCardBase | null> {
    const response = await this.http.post<CircleResponse<CircleCard>>(
      'v1/cards',
      request
    )

    if (isCircleSuccessResponse(response.data)) {
      return toCardBase(response.data.data)
    }

    this.logger.error({ response }, 'Failed to create payment card')
    return null
  }

  async createPayment(
    request: CircleCreatePayment
  ): Promise<ToPaymentBase | null> {
    const response = await this.http.post<
      CircleResponse<CirclePaymentResponse>
    >('v1/payments', request)

    if (isCircleSuccessResponse(response.data)) {
      return toPaymentBase(response.data.data)
    }

    this.logger.error({ response }, 'Failed to create payment')
    return null
  }

  async cancelPayment(
    id: string,
    request: { reason?: CirclePaymentCancelReason; idempotencyKey?: string }
  ) {
    const response = await this.http.post<
      CircleResponse<CirclePaymentResponse>
    >(`v1/payments/${id}/cancel`, request)

    if (isCircleSuccessResponse(response.data)) {
      return toPaymentBase(response.data.data)
    }

    throw new Error(
      `Failed to cancel payment, code: ${response.data.code}; message: ${response.data.message}`
    )
  }

  async createWalletTransfer(
    request:
      | CircleCreateWalletTransferRequest
      | CircleCreateWalletTransferPayoutRequest
  ): Promise<CircleCreateWalletTransferResponse | null> {
    const response = await this.http.post<
      CircleResponse<CircleCreateWalletTransferResponse>
    >('v1/transfers', request)

    if (isCircleSuccessResponse(response.data) && response.data.data) {
      return response.data.data
    }

    this.logger.error({ response }, 'Failed to create wallet transfer')
    return null
  }

  async createUserWallet(
    request: CircleCreateWallet
  ): Promise<CircleWallet | null> {
    const response = await this.http.post<CircleResponse<CircleWallet>>(
      'v1/wallets',
      request
    )

    if (isCircleSuccessResponse(response.data) && response.data.data) {
      return response.data.data
    }

    this.logger.error({ response }, 'Failed to create a new user wallet')
    return null
  }

  async createWireBankAccount(
    request: CircleCreateWireBankAccountRequest
  ): Promise<CircleWireBankAccount | null> {
    const response = await this.http.post<
      CircleResponse<CircleWireBankAccount>
    >('v1/banks/wires', request)

    if (isCircleSuccessResponse(response.data) && response.data.data) {
      return response.data.data
    }

    this.logger.error({ response }, 'Failed to create a new bank account')
    return null
  }

  async createWirePayout(
    request: CircleCreateWirePayoutRequest
  ): Promise<CirclePayout | null> {
    const response = await this.http.post<CircleResponse<CirclePayout>>(
      'v1/payouts',
      request
    )

    if (isCircleSuccessResponse(response.data) && response.data.data) {
      return response.data.data
    }

    this.logger.error({ response }, 'Failed to create wire payout')

    return null
  }

  async getWireInstructions(
    id: string
  ): Promise<CircleWireInstructions | null> {
    const response = await this.http.get<
      CircleResponse<CircleWireInstructions>
    >(`v1/banks/wires/${id}/instructions`)

    if (isCircleSuccessResponse(response.data)) {
      return response.data.data
    }

    this.logger.error(
      { response },
      'Failed to get wire instructions for bank account'
    )
    return null
  }

  async getUserWallet(walletId: string): Promise<CircleWallet | null> {
    const response = await this.http.get<CircleResponse<CircleWallet>>(
      `v1/wallets/${walletId}`
    )

    if (isCircleSuccessResponse(response.data) && response.data.data) {
      return response.data.data
    } else if (response.status === 404) {
      return null
    }

    this.logger.error(
      { response },
      `Failed to get the user wallet with id: ${walletId}`
    )
    return null
  }

  async getMerchantWallet(): Promise<CircleWallet | null> {
    if (!this.masterWalletId) {
      this.masterWalletId = await this.getMasterWalletId()
    }

    const response = await this.http.get<CircleResponse<CircleWallet>>(
      `v1/wallets/${this.masterWalletId}`
    )

    if (isCircleSuccessResponse(response.data)) {
      return response.data.data
    }

    this.logger.error({ response }, 'Failed to get the merchant wallet')
    return null
  }

  async getPaymentCardById(id: string): Promise<ToPaymentCardBase | null> {
    const response = await this.http.get<CircleResponse<CircleCard>>(
      `v1/cards/${id}`
    )

    if (isCircleSuccessResponse(response.data)) {
      return toCardBase(response.data.data)
    }

    this.logger.error({ response }, 'Failed to get payment card')
    return null
  }

  async getPaymentById(id: string): Promise<ToPaymentBase | null> {
    const response = await this.http.get<CircleResponse<CirclePaymentResponse>>(
      `v1/payments/${id}`
    )

    if (isCircleSuccessResponse(response.data)) {
      return toPaymentBase(response.data.data)
    }

    this.logger.error({ response }, 'Failed to get payment')
    return null
  }

  async getBlockchainAddress(
    walletId: string,
    blockchainAddress: string
  ): Promise<CircleBlockchainAddress> {
    const response = await this.http.get<
      CircleResponse<CircleBlockchainAddress[]>
    >(`v1/wallets/${walletId}/addresses`)

    if (isCircleSuccessResponse(response.data)) {
      const address = await this.searchForEntityInPaginatedResponseList(
        response,
        (data) =>
          data.data.find((address) => address.address === blockchainAddress)
      )
      if (address) {
        return address
      }
      return null
    }

    this.logger.error({ response }, 'Failed to get addresses for wallet')
    return null
  }

  async getPayments(query: { settlementId?: string }) {
    const response = await this.http.get<
      CircleResponse<CirclePaymentResponse[]>
    >(`v1/payments`, {
      params: query,
    })

    if (isCircleSuccessResponse(response.data)) {
      return response.data.data.map((payment) => toPaymentBase(payment))
    }

    this.logger.error({ response }, 'Failed to get payments')
    return []
  }

  async searchForEntityInPaginatedResponseList(
    response: HttpResponse<CircleResponse>,
    searchFunction: (data) => unknown
  ) {
    if (!isCircleSuccessResponse(response.data)) {
      return null
    }
    const parsedLinkHeader = parseLinkHeader(response.headers.link)
    const entity = searchFunction(response.data)
    if (entity) {
      return entity
    } else if (parsedLinkHeader?.next?.url) {
      const nextResponse: HttpResponse<CircleResponse> = await this.http.get(
        parsedLinkHeader.next.url
      )
      return this.searchForEntityInPaginatedResponseList(
        nextResponse,
        searchFunction
      )
    }
    return null
  }

  async getTransferById(id: string): Promise<ToPaymentBase | null> {
    const response = await this.http.get<CircleResponse<CircleTransfer>>(
      `v1/transfers/${id}`
    )

    if (isCircleSuccessResponse(response.data)) {
      return toPaymentBase(response.data.data)
    }

    this.logger.error({ response }, 'Failed to get transfer by ID')
    return null
  }
}
