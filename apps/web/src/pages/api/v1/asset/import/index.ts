import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateInitializeImportAsset } from '@/utils/asset-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type InitializeBodyType = ExtractBodyType<typeof validateInitializeImportAsset>

handler.post(
  validateBodyMiddleware(validateInitializeImportAsset),
  async (
    request: NextApiRequestApp<InitializeBodyType>,
    response: NextApiResponse
  ) => {
    const { externalId } = request.user
    const { address, assetIndex } = request.validResult
      .value as InitializeBodyType

    const result = await ApiClient.instance.initializeImportCollectible({
      externalId,
      address,
      assetIndex,
    })

    response.json(result)
  }
)

export default handler
