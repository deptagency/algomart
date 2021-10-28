import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validatepPassphrase } from '@/utils/auth-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validatepPassphrase>

handler.post(
  validateBodyMiddleware(validatepPassphrase),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const body = request.validResult.value as BodyType

    if (!request.user.externalId) {
      throw new BadRequest('No externalId provided')
    }
    try {
      const result = await ApiClient.instance.verifyPassphrase(
        request.user.externalId,
        body.passphrase
      )
      response.json(result)
    } catch {
      response.json({ isValid: false })
    }
  }
)

export default handler
