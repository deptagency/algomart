import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  response.json(await ApiClient.instance.getAllCollections())
})

export default handler
