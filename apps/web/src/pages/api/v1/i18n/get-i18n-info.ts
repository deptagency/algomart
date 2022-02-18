import { NotFound } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const i18n = await ApiClient.instance.getI18n(request.query.locale as string)

  if (!i18n) {
    throw new NotFound('I18n information not found')
  }

  response.status(200).json(i18n)
})

export default handler
