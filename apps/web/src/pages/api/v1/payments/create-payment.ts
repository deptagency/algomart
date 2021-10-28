import { CirclePaymentVerificationOptions } from '@algomart/schemas'
import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'
import { v4 as uuid } from 'uuid'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import getIPAddress from '@/utils/get-ip-address'
import { validatePurchase } from '@/utils/purchase-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validatePurchase>

handler.post(
  validateBodyMiddleware(validatePurchase),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    // Variables
    const sessionId = uuid()
    const ipAddress = getIPAddress(request)

    if (!ipAddress) {
      throw new BadRequest('IP address required')
    }

    const body = request.validResult.value as BodyType
    const email = request.token.email as string

    // Create payment
    const payment = await ApiClient.instance.createPayment({
      idempotencyKey: uuid(),
      keyId: body.verificationKeyId,
      encryptedData: body.verificationEncryptedData,
      verification: CirclePaymentVerificationOptions.cvv,
      metadata: {
        email,
        ipAddress,
        sessionId,
      },
      description: body.description,
      cardId: body.cardId,
      payerExternalId: request.user.externalId,
      packTemplateId: body.packTemplateId,
    })

    const paymentId = payment?.externalId

    if (!paymentId) {
      throw new BadRequest('Payment could not be created')
    }

    response.status(201).json(payment)
  }
)

export default handler
