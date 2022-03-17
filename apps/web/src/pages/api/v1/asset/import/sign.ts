import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateTransferCollectible } from '@/utils/asset-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type ImportBodyType = ExtractBodyType<typeof validateTransferCollectible>

handler.post(
  validateBodyMiddleware(validateTransferCollectible),
  async (
    request: NextApiRequestApp<ImportBodyType>,
    response: NextApiResponse
  ) => {
    const { externalId } = request.user
    const {
      address,
      assetIndex,
      passphrase,
      signedTransaction,
      transactionId,
    } = request.validResult.value as ImportBodyType

    const result = await ApiClient.instance.importCollectible({
      externalId,
      address,
      assetIndex,
      passphrase,
      signedTransaction,
      transactionId,
    })

    response.json(result)
  }
)

export default handler
