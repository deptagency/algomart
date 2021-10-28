import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.post(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const redeemCode = request.body.redeemCode || null

  if (!redeemCode) {
    throw new BadRequest('Redemption code is required')
  }

  const { pack } = await ApiClient.instance.redeemablePack({
    redeemCode,
    locale: request.query.locale as string,
  })

  return response.json({
    redeemCode,
    pack,
  })
})

export default handler
