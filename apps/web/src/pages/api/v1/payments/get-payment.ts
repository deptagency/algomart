import { BadRequest, NotFound } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  if (!request.query.paymentId || typeof request.query.paymentId !== 'string') {
    throw new BadRequest('Payment ID is required')
  }

  const payment = await ApiClient.instance.getPaymentById(
    request.query.paymentId
  )

  if (!payment) {
    throw new NotFound('Payment not found')
  }

  response.status(200).json(payment)
})

export default handler
