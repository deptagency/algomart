import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateInitializeTransferCollectible } from '@/utils/asset-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type InitializeBodyType = ExtractBodyType<
  typeof validateInitializeTransferCollectible
>

handler.post(
  validateBodyMiddleware(validateInitializeTransferCollectible),
  async (
    request: NextApiRequestApp<InitializeBodyType>,
    response: NextApiResponse
  ) => {
    const { externalId } = request.user
    const { address, assetIndex } = request.validResult
      .value as InitializeBodyType

    const result = await ApiClient.instance.initializeExportCollectible({
      externalId,
      address,
      assetIndex,
    })

    response.json(result)
  }
)

export default handler
