import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  if (
    !request.query.bankAccountId ||
    typeof request.query.bankAccountId !== 'string'
  ) {
    throw new BadRequest('Bank account ID is required')
  }

  const bankAccount = await ApiClient.instance.getBankAddressStatus(
    request.query.bankAccountId
  )

  response.status(200).json(bankAccount)
})

export default handler
