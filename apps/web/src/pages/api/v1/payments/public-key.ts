import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const publicKey = await ApiClient.instance.getPublicKey()

  if (!publicKey?.keyId) {
    throw new BadRequest('Public key not created')
  }

  response.json(publicKey)
})

export default handler
