import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateUpdateCard } from '@/utils/purchase-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateUpdateCard>

handler.patch(
  validateBodyMiddleware(validateUpdateCard),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    if (!request.user.externalId) {
      throw new BadRequest('No external ID provided')
    }

    const body = request.validResult.value as BodyType

    if (!body.cardId || typeof body.cardId !== 'string') {
      throw new BadRequest('Card ID is required')
    }

    // Update cards with new default
    const success = await ApiClient.instance.updateCardById(body.cardId, {
      default: body.default,
      ownerExternalId: request.user.externalId,
    })

    response.status(200).json({ success })
  }
)

export default handler
