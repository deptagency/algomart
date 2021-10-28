import {
  CircleCard,
  CircleCardStatus,
  CircleCardVerification,
  CircleCreateCard,
  CircleCreatePayment,
  CirclePaymentResponse,
  CirclePaymentStatus,
  CirclePaymentVerification,
  CirclePublicKey,
  CircleResponse,
  CircleVerificationAVSFailureCode,
  CircleVerificationAVSSuccessCode,
  CircleVerificationCvvStatus,
  isCircleSuccessResponse,
  PaymentCardStatus,
  PaymentStatus,
  PublicKey,
  ToPaymentBase,
  ToPaymentCardBase,
} from '@algomart/schemas'
import got, { Got } from 'got'

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
}
