import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import adminMiddleware from '@/middleware/admin-middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware()).use(adminMiddleware())

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const payments = await ApiClient.instance.getPayments(request.query)

  if (payments) {
    response.status(200).json(payments)
  }

  response.status(200)
})

export default handler
