import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

handler.delete(
  async (request: NextApiRequestApp, response: NextApiResponse) => {
    if (!request.query.cardId || typeof request.query.cardId !== 'string') {
      throw new BadRequest('Card ID is required')
    }

    const success = await ApiClient.instance.removeCardById(
      request.query.cardId
    )

    response.status(200).json({ success })
  }
)

export default handler
