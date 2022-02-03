import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import adminMiddleware from '@/middleware/admin-middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateRevokeAsset } from '@/utils/asset-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware()).use(adminMiddleware())

type BodyType = ExtractBodyType<typeof validateRevokeAsset>

handler.post(
  validateBodyMiddleware(validateRevokeAsset),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const { packId, ownerId } = request.validResult.value as BodyType

    const result = await ApiClient.instance.revokePack({
      packId,
      ownerId,
    })

    response.json(result)
  }
)

export default handler
