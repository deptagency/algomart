import { NotFound } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const currencyConversions = await ApiClient.instance.getCurrencyConversions({
    sourceCurrency: request.query.sourceCurrency as string,
  })

  if (!currencyConversions) {
    throw new NotFound('Currency conversions not found')
  }

  response.status(200).json(currencyConversions)
})

export default handler
