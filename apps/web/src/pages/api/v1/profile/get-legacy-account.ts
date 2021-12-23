import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  console.log('request.query', request.query)

  const { legacyEmail } = await ApiClient.instance.getLegacyAccount(
    // @ts-ignore idk
    request.query
  )
  response.json({ legacyEmail })
})

export default handler
