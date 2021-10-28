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
import { validateCard } from '@/utils/purchase-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateCard>

handler.post(
  validateBodyMiddleware(validateCard),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    // Variables
    const sessionId = uuid()
    const ipAddress = getIPAddress(request)

    if (!ipAddress) {
      throw new BadRequest('IP address required')
    }

    const body = request.validResult.value as BodyType
    const email = request.token.email as string

    // Create card
    const card = await ApiClient.instance.createCard({
      billingDetails: {
        name: body.fullName,
        city: body.city,
        country: body.country,
        line1: body.address1,
        line2: body.address2 || '',
        district: body.state,
        postalCode: body.zipCode,
      },
      encryptedData: body.encryptedData,
      keyId: body.keyId,
      expirationMonth: Number.parseInt(body.expMonth, 10),
      expirationYear: Number.parseInt('20' + body.expYear, 10),
      idempotencyKey: uuid(),
      metadata: {
        email,
        ipAddress,
        sessionId,
      },
      ownerExternalId: request.user.externalId,
      saveCard: body.saveCard,
      default: body.default,
    })

    const cardId = card?.externalId
    if (!cardId) {
      throw new BadRequest('Credit card could not be created')
    }

    response.status(201).json(card)
  }
)

export default handler
