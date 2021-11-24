import {
  CircleBankAccount,
  CircleBankAccountStatus,
  CircleCard,
  CircleCardStatus,
  CircleCardVerification,
  CircleCreateBankAccount,
  CircleCreateCard,
  CircleCreatePayment,
  CirclePaymentQuery,
  CirclePaymentResponse,
  CirclePaymentStatus,
  CirclePaymentVerification,
  CirclePublicKey,
  CircleResponse,
  CircleVerificationAVSFailureCode,
  CircleVerificationAVSSuccessCode,
  CircleVerificationCvvStatus,
  GetPaymentBankAccountInstructions,
  isCircleSuccessResponse,
  PaymentBankAccountStatus,
  PaymentCardStatus,
  PaymentStatus,
  PublicKey,
  ToPaymentBankAccountBase,
  ToPaymentBase,
  ToPaymentCardBase,
} from '@algomart/schemas'
import got, { Got } from 'got'
import { URLSearchParams } from 'node:url'

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
  status: CirclePaymentStatus,
  verification: CirclePaymentVerification
): PaymentStatus {
  let finalStatus
  if (
    status === CirclePaymentStatus.Failed ||
    Object.values(CircleVerificationAVSFailureCode).includes(
      verification?.avs
    ) ||
    verification?.cvv === CircleVerificationCvvStatus.Fail
  ) {
    finalStatus = PaymentStatus.Failed
  } else if (
    status === CirclePaymentStatus.Paid &&
    Object.values(CircleVerificationAVSSuccessCode).includes(
      verification?.avs
    ) &&
    verification?.cvv === CircleVerificationCvvStatus.Pass
  ) {
    finalStatus = PaymentStatus.Paid
  } else if (status === CirclePaymentStatus.Confirmed) {
    finalStatus = PaymentStatus.Confirmed
  } else {
    finalStatus = PaymentStatus.Pending
  }
  return finalStatus
}

function toPaymentBase(response: CirclePaymentResponse): ToPaymentBase {
  return {
    externalId: response.id,
    status: toPaymentStatus(response.status, response.verification),
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

  async toPaymentBase(
    request: CirclePaymentResponse
  ): Promise<ToPaymentBase | null> {
    return toPaymentBase(request)
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

  async getPayments(
    query: CirclePaymentQuery
  ): Promise<CirclePaymentResponse[] | null> {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      searchParams.append(key, `${value}`)
    }
    const response = await this.http
      .get('v1/payments', { searchParams })
      .json<CircleResponse<CirclePaymentResponse[]>>()

    if (isCircleSuccessResponse(response)) {
      return response.data
    }

    this.logger.error({ response }, 'Failed to get payments')
    return null
  }
}
