import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const { packs, total } = await ApiClient.instance.getPublishedPacks(
    request.query
  )
  response.json({ packs, total })
})

export default handler
