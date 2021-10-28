import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateRedeemAsset } from '@/utils/asset-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateRedeemAsset>

handler.post(
  validateBodyMiddleware(validateRedeemAsset),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const { externalId } = request.user
    const { redeemCode } = request.validResult.value as BodyType

    const result = await ApiClient.instance.claimRedeemPack({
      externalId,
      redeemCode,
    })

    response.json(result)
  }
)

export default handler
