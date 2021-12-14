import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateTransferPurchase } from '@/utils/purchase-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateTransferPurchase>

handler.post(
  validateBodyMiddleware(validateTransferPurchase),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const body = request.validResult.value as BodyType

    // Create payment
    const payment = await ApiClient.instance.createTransferPurchase({
      payerExternalId: request.user.externalId,
      packTemplateId: body.packTemplateId,
    })

    const paymentId = payment?.externalId

    if (!paymentId) {
      throw new BadRequest('Payment for transfer could not be created')
    }

    response.status(201).json(payment)
  }
)

export default handler
