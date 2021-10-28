import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  if (!request.user.externalId) {
    throw new BadRequest('No external ID provided')
  }

  // Find cards by owner
  const cards = await ApiClient.instance.getCards({
    ownerExternalId: request.user.externalId,
  })

  response.status(200).json({ cards })
})

export default handler
