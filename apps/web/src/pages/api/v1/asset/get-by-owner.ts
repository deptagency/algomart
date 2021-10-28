import { HTTPError } from 'ky'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  try {
    const result = await ApiClient.instance.getCollectiblesByUser(request.query)
    response.json(result)
  } catch (error) {
    if (error instanceof HTTPError) {
      response.status(error.response.status).json(error.response.body)
    } else {
      response.status(500).json({ message: (error as Error).message })
    }
  }
})

export default handler
