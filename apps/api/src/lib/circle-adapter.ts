import {
  CheckoutMethod,
  CircleBankAccount,
  CircleBankAccountStatus,
  CircleBlockchainAddress,
  CircleCard,
  CircleCardStatus,
  CircleCardVerification,
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
  CircleVerificationAVSFailureCode,
  CircleVerificationAVSSuccessCode,
  CircleVerificationCvvStatus,
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
import got, { Got } from 'got'
import { URLSearchParams } from 'node:url'

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

function toCardStatus(
  status: CircleCardStatus,
  verification: CircleCardVerification
): PaymentCardStatus {
  let finalStatus
  if (
    status === CircleCardStatus.Failed ||
    Object.values(CircleVerificationAVSFailureCode).includes(
      verification.avs
    ) ||
    verification.cvv === CircleVerificationCvvStatus.Fail
  ) {
    finalStatus = PaymentCardStatus.Failed
  } else if (
    status === CircleCardStatus.Complete &&
    Object.values(CircleVerificationAVSSuccessCode).includes(
      verification.avs
    ) &&
    verification.cvv === CircleVerificationCvvStatus.Pass
  ) {
    finalStatus = PaymentCardStatus.Complete
  } else {
    finalStatus = PaymentCardStatus.Pending
  }
  return finalStatus
}

function toCardBase(response: CircleCard): ToPaymentCardBase {
  return {
    expirationMonth: response.expMonth ? `${response.expMonth}` : undefined,
    expirationYear: response.expYear ? `${response.expYear}` : undefined,
    externalId: response.id,
    network: response.network,
    lastFour: response.last4,
    status: toCardStatus(response.status, response.verification),
    error: response.errorCode,
  }
}

function toPaymentStatus(
  status: CirclePaymentStatus | CircleTransferStatus
): PaymentStatus {
  let finalStatus
  switch (status) {
    case CirclePaymentStatus.Failed:
      finalStatus = PaymentStatus.Failed
      break
    case CirclePaymentStatus.Paid:
      finalStatus = PaymentStatus.Paid
      break
    case CirclePaymentStatus.Confirmed:
      finalStatus = PaymentStatus.Confirmed
      break
    case CirclePaymentStatus.Pending:
      finalStatus = PaymentStatus.Pending
      break
    case CircleTransferStatus.Failed:
      finalStatus = PaymentStatus.Failed
      break
    case CircleTransferStatus.Complete:
      finalStatus = PaymentStatus.Paid
      break
    case CircleTransferStatus.Pending:
      finalStatus = PaymentStatus.Pending
      break
    default:
      finalStatus = PaymentStatus.Pending
  }
  return finalStatus
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
  }
}

export default class CircleAdapter {
  logger = logger.child({ context: this.constructor.name })
  http: Got

  constructor(readonly options: CircleAdapterOptions) {
    this.http = got.extend({
      prefixUrl: options.url,
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
      },
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
    return response.statusCode === 200
  }

  async getPublicKey(): Promise<PublicKey | null> {
    const response = await this.http
      .get('v1/encryption/public')
      .json<CircleResponse<CirclePublicKey>>()

    if (isCircleSuccessResponse(response)) {
      return toPublicKeyBase(response.data)
    }

    this.logger.error({ response }, 'Failed to get public key')
    return null
  }

  async createBlockchainAddress(
    request: CircleCreateBlockchainAddress
  ): Promise<CircleBlockchainAddress | null> {
    const response = await this.http
      .post(`v1/wallets/${request.walletId}/addresses`, {
        json: {
          idempotencyKey: request.idempotencyKey,
          currency: 'USD',
          chain: 'ALGO',
        },
      })
      .json<CircleResponse<CircleBlockchainAddress>>()

    if (isCircleSuccessResponse(response)) {
      return response.data
    }

    this.logger.error({ response }, 'Failed to create blockchain address')
    return null
  }

  async createPaymentCard(
    request: CircleCreateCard
  ): Promise<ToPaymentCardBase | null> {
    const response = await this.http
      .post('v1/cards', {
        json: request,
      })
      .json<CircleResponse<CircleCard>>()

    if (isCircleSuccessResponse(response)) {
      return toCardBase(response.data)
    }

    this.logger.error({ response }, 'Failed to create payment card')
    return null
  }

  async createBankAccount(
    request: CircleCreateBankAccount
  ): Promise<ToPaymentBankAccountBase | null> {
    const response = await this.http
      .post('v1/banks/wires', {
        json: request,
      })
      .json<CircleResponse<CircleBankAccount>>()

    if (isCircleSuccessResponse(response)) {
      return toBankAccountBase(response.data)
    }

    this.logger.error({ response }, 'Failed to create bank account')
    return null
  }

  async createPayment(
    request: CircleCreatePayment
  ): Promise<ToPaymentBase | null> {
    const response = await this.http
      .post('v1/payments', {
        json: request,
      })
      .json<CircleResponse<CirclePaymentResponse>>()

    if (isCircleSuccessResponse(response)) {
      return toPaymentBase(response.data)
    }

    this.logger.error({ response }, 'Failed to create payment')
    return null
  }

  async getMerchantWallet(): Promise<CircleWallet | null> {
    const response = await this.http
      .get('v1/wallets')
      .json<CircleResponse<CircleWallet[]>>()

    if (isCircleSuccessResponse(response) && response.data) {
      const merchantWallet = response.data.find(
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
    const response = await this.http
      .get(`v1/banks/wires/${id}/instructions`)
      .json<CircleResponse<GetPaymentBankAccountInstructions>>()

    if (isCircleSuccessResponse(response)) {
      return response.data
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
    const response = await this.http
      .get(`v1/banks/wires/${id}`)
      .json<CircleResponse<CircleBankAccount>>()

    if (isCircleSuccessResponse(response)) {
      return toBankAccountBase(response.data)
    }

    this.logger.error({ response }, 'Failed to get payment bank account')
    return null
  }

  async getPaymentCardById(id: string): Promise<ToPaymentCardBase | null> {
    const response = await this.http
      .get(`v1/cards/${id}`)
      .json<CircleResponse<CircleCard>>()

    if (isCircleSuccessResponse(response)) {
      return toCardBase(response.data)
    }

    this.logger.error({ response }, 'Failed to get payment card')
    return null
  }

  async getPaymentById(id: string): Promise<ToPaymentBase | null> {
    const response = await this.http
      .get(`v1/payments/${id}`)
      .json<CircleResponse<CirclePaymentResponse>>()

    if (isCircleSuccessResponse(response)) {
      return toPaymentBase(response.data)
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
    const response = await this.http
      .get('v1/transfers', {
        searchParams,
      })
      .json<CircleResponse<CircleTransfer[]>>()

    if (isCircleSuccessResponse(response)) {
      const transfer = response.data.find(
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
    const response = await this.http
      .get(`v1/transfers/${id}`)
      .json<CircleResponse<CircleTransfer>>()

    if (isCircleSuccessResponse(response)) {
      return toPaymentBase(response.data)
    }

    this.logger.error({ response }, 'Failed to get transfer by ID')
    return null
  }

  async getPayments(query: CirclePaymentQuery): Promise<WirePayment[] | null> {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      searchParams.append(key, `${value}`)
    }
    const response = await this.http
      .get('v1/payments', { searchParams })
      .json<CircleResponse<CirclePaymentResponse[]>>()

    if (isCircleSuccessResponse(response)) {
      return response.data.map((payment) => {
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
