import { NotFound } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const languages = await ApiClient.instance.getLanguages(
    request.query.locale as string
  )

  if (!languages) {
    throw new NotFound('Languages not found')
  }

  response.status(200).json(languages)
})

export default handler
