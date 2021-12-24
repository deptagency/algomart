import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  // @ts-ignore narrowing
  if (typeof request.query.token === 'string[]') {
    return response.json({})
  }
  const { legacyEmail } = await ApiClient.instance.getLegacyAccount(
    request.query.token
  )
  response.json({ legacyEmail })
})

export default handler
