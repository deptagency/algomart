import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateShareProfile } from '@/utils/asset-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateShareProfile>

handler.put(
  validateBodyMiddleware(validateShareProfile),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    response.json({
      ok: await ApiClient.instance.updateAccount({
        externalId: request.user.externalId,
        showProfile: request.body.shareProfile,
      }),
    })
  }
)

export default handler
