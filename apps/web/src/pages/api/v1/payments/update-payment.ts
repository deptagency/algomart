import { PaymentStatus } from '@algomart/schemas'
import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import adminMiddleware from '@/middleware/admin-middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateUpdatePayment } from '@/utils/purchase-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware()).use(adminMiddleware())

type BodyType = ExtractBodyType<typeof validateUpdatePayment>

handler.patch(
  validateBodyMiddleware(validateUpdatePayment),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    if (!request.user.externalId) {
      throw new BadRequest('No external ID provided')
    }

    const body = request.validResult.value as BodyType

    if (!body.paymentId || typeof body.paymentId !== 'string') {
      throw new BadRequest('Payment ID is required')
    }

    // Update payment
    const json: { status: PaymentStatus; externalId?: string } = {
      status: body.status as PaymentStatus,
    }
    if (body?.externalId) json.externalId = body.externalId
    const payment = await ApiClient.instance.updatePaymentById(
      body.paymentId,
      json
    )

    if (!payment) {
      throw new BadRequest('Payment not updated')
    }

    response.status(200).json({ ...payment })
  }
)

export default handler
