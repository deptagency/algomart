import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  console.log('request.query', request.query)

  const { packs, total } = await ApiClient.instance.getLegacyAccount(
    request.query
  )
  response.json({ packs, total })
})

export default handler
