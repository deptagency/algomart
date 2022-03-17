import {
  CheckoutMethod,
  CircleBankAccount,
  CircleBankAccountStatus,
  CircleBlockchainAddress,
  CircleCard,
  CircleCardStatus,
  CircleCreateBankAccount,
  CircleCreateBlockchainAddress,
  CircleCreateCard,
  CircleCreatePayment,
  CirclePaymentQuery,
  CirclePaymentResponse,
  CirclePaymentSourceType,
  CirclePaymentStatus,
  CirclePublicKey,
  CircleResponse,
  CircleTransfer,
  CircleTransferQuery,
  CircleTransferSourceType,
  CircleTransferStatus,
  CircleWallet,
  GetPaymentBankAccountInstructions,
  isCircleSuccessResponse,
  PaymentBankAccountStatus,
  PaymentCardStatus,
  PaymentStatus,
  PublicKey,
  ToPaymentBankAccountBase,
  ToPaymentBase,
  ToPaymentCardBase,
  WirePayment,
} from '@algomart/schemas'

import { HttpTransport } from '@/utils/http-transport'
import { invariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

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

function toPaymentType(
  type: CirclePaymentSourceType | CircleTransferSourceType
): CheckoutMethod | undefined {
  let finalType
  switch (type) {
    case CirclePaymentSourceType.card:
      finalType = CheckoutMethod.card
      break
    case CirclePaymentSourceType.wire:
      finalType = CheckoutMethod.wire
      break
    case CircleTransferSourceType.wallet:
      finalType = CheckoutMethod.crypto
      break
    default:
      finalType = undefined
      break
  }
  return finalType
}

function toBankAccountStatus(
  status: CircleBankAccountStatus
): PaymentBankAccountStatus {
  let finalStatus
  if (status === CircleBankAccountStatus.Failed) {
    finalStatus = PaymentBankAccountStatus.Failed
  } else if (status === CircleBankAccountStatus.Complete) {
    finalStatus = PaymentBankAccountStatus.Complete
  } else {
    finalStatus = PaymentBankAccountStatus.Pending
  }
  return finalStatus
}

function toBankAccountBase(
  response: CircleBankAccount
): ToPaymentBankAccountBase {
  return {
    externalId: response.id,
    description: response.description,
    status: toBankAccountStatus(response.status),
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
    expirationMonth: response.expMonth ? `${response.expMonth}` : undefined,
    expirationYear: response.expYear ? `${response.expYear}` : undefined,
    externalId: response.id,
    network: response.network,
    lastFour: response.last4,
    status: toCardStatus(response.status),
    error: response.errorCode,
  }
}

function toPaymentStatus(
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
    }[status] || PaymentStatus.Pending
  )
}

function toPaymentBase(
  response: CirclePaymentResponse | CircleTransfer
): ToPaymentBase {
  return {
    externalId: response.id,
    amount: response.amount.amount,
    sourceId: response.source.id,
    status: toPaymentStatus(response.status),
    error: response.errorCode,
    action: (response as CirclePaymentResponse).requiredAction?.redirectUrl,
  }
}

export default class CircleAdapter {
  logger = logger.child({ context: this.constructor.name })
  http: HttpTransport

  constructor(readonly options: CircleAdapterOptions) {
    this.http = new HttpTransport(options.url, undefined, {
      Authorization: `Bearer ${options.apiKey}`,
    })

    this.testConnection()
  }

  async testConnection() {
    try {
      const publicKey = await this.getPublicKey()
      invariant(publicKey)
      this.logger.info('Successfully connected to Circle')
    } catch (error) {
      this.logger.error(error, 'Failed to connect to Circle')
    }
  }

  async ping() {
    const response = await this.http.get('ping')
    return response.status === 200
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

  async createBankAccount(
    request: CircleCreateBankAccount
  ): Promise<ToPaymentBankAccountBase | null> {
    const response = await this.http.post<CircleResponse<CircleBankAccount>>(
      'v1/banks/wires',
      request
    )

    if (isCircleSuccessResponse(response.data)) {
      return toBankAccountBase(response.data.data)
    }

    this.logger.error({ response }, 'Failed to create bank account')
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

  async getMerchantWallet(): Promise<CircleWallet | null> {
    const response = await this.http.get<CircleResponse<CircleWallet[]>>(
      'v1/wallets'
    )

    if (isCircleSuccessResponse(response.data) && response.data.data) {
      const merchantWallet = response.data.data.find(
        (wallet: CircleWallet) => wallet.type === 'merchant'
      )
      if (merchantWallet) return merchantWallet
      return null
    }

    this.logger.error({ response }, 'Failed to get the merchant wallet')
    return null
  }

  async getPaymentBankAccountInstructionsById(
    id: string
  ): Promise<GetPaymentBankAccountInstructions | null> {
    const response = await this.http.get<
      CircleResponse<GetPaymentBankAccountInstructions>
    >(`v1/banks/wires/${id}/instructions`)

    if (isCircleSuccessResponse(response.data)) {
      return response.data.data
    }

    this.logger.error(
      { response },
      'Failed to get payment bank account instructions'
    )
    return null
  }

  async getPaymentBankAccountById(
    id: string
  ): Promise<ToPaymentBankAccountBase | null> {
    const response = await this.http.get<CircleResponse<CircleBankAccount>>(
      `v1/banks/wires/${id}`
    )

    if (isCircleSuccessResponse(response.data)) {
      return toBankAccountBase(response.data.data)
    }

    this.logger.error({ response }, 'Failed to get payment bank account')
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

  async getTransferForAddress(
    query: CircleTransferQuery,
    destinationAddressId: string
  ): Promise<ToPaymentBase | null> {
    const searchParams = {}
    if (query.from) Object.assign(searchParams, { from: query.from })
    if (query.to) Object.assign(searchParams, { to: query.to })
    if (query.pageBefore)
      Object.assign(searchParams, { pageBefore: query.pageBefore })
    if (query.pageAfter)
      Object.assign(searchParams, { pageAfter: query.pageAfter })
    if (query.pageSize)
      Object.assign(searchParams, { pageSize: query.pageSize })
    const response = await this.http.get<CircleResponse<CircleTransfer[]>>(
      'v1/transfers',
      {
        params: searchParams,
      }
    )

    if (isCircleSuccessResponse(response.data)) {
      const transfer = response.data.data.find(
        (transfer) => transfer.destination.address === destinationAddressId
      )
      if (transfer) {
        return toPaymentBase(transfer)
      }
      return null
    }

    this.logger.error(
      { response },
      'Failed to get transfers for external wallet'
    )
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

  async getPayments(query: CirclePaymentQuery): Promise<WirePayment[] | null> {
    const response = await this.http.get<
      CircleResponse<CirclePaymentResponse[]>
    >('v1/payments', { params: query })

    if (isCircleSuccessResponse(response.data)) {
      return response.data.data.map((payment) => {
        const base = toPaymentBase(payment)
        const type = toPaymentType(payment.source.type)
        return {
          ...base,
          createdAt: payment.createDate,
          updatedAt: payment.updateDate,
          id: payment.id,
          type,
        }
      })
    }

    this.logger.error({ response }, 'Failed to get payments')
    return null
  }
}
