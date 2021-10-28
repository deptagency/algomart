import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateAddPublicAsset } from '@/utils/asset-validation'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = ExtractBodyType<typeof validateAddPublicAsset>

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const result = await ApiClient.instance.getShowcaseByUser({
    ownerUsername: request.user.username,
  })

  if (result) response.json(result)
  else response.status(404).end()
})

handler.post(
  validateBodyMiddleware(validateAddPublicAsset),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const ok = await ApiClient.instance.addShowcase({
      collectibleId: request.body.id,
      ownerUsername: request.user.username,
    })
    response.json({ ok })
  }
)

handler.delete(
  validateBodyMiddleware(validateAddPublicAsset),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const ok = await ApiClient.instance.removeShowcase({
      collectibleId: request.body.id,
      ownerUsername: request.user.username,
    })
    response.json({ ok })
  }
)

export default handler
