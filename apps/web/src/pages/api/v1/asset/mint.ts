import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateMintAsset } from '@/utils/asset-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateMintAsset>

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const packId = request.query.packId as string
  response.json(
    await ApiClient.instance.mintPackStatus({
      packId,
      externalId: request.user.externalId,
    })
  )
})

handler.post(
  validateBodyMiddleware(validateMintAsset),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const body = request.validResult.value as BodyType
    const packId = body.packId

    await ApiClient.instance.mintPack({
      packId,
      externalId: request.user.externalId,
    })
    response.status(204).end()
  }
)

export default handler
