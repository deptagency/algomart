import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateExportAsset } from '@/utils/asset-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateExportAsset>

handler.post(
  validateBodyMiddleware(validateExportAsset),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const { externalId } = request.user
    const { address, assetIndex, passphrase } = request.validResult
      .value as BodyType

    const result = await ApiClient.instance.exportCollectible({
      externalId,
      address,
      assetIndex,
      passphrase,
    })

    response.json({ ok: result })
  }
)

export default handler
