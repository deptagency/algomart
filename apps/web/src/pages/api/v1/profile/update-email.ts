import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateEmail } from '@/utils/auth-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateEmail>

handler.put(
  validateBodyMiddleware(validateEmail),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    if (!request.user.externalId) {
      throw new BadRequest('No externalId provided')
    }
    response.json({
      ok: await ApiClient.instance.updateAccount({
        externalId: request.user.externalId,
        email: request.body.email,
      }),
    })
  }
)

export default handler
