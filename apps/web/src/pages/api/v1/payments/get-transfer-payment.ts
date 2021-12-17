import { BadRequest, NotFound } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  if (
    !request.query.destinationAddress ||
    typeof request.query.destinationAddress !== 'string'
  ) {
    throw new BadRequest('Destination address is required')
  }

  const transfer = await ApiClient.instance.getTransferByAddress({
    destinationAddress: request.query.destinationAddress,
  })

  if (transfer) {
    response.status(200).json(transfer)
  }

  response.status(200)
})

export default handler
