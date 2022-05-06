import { NotFound } from 'http-errors'
import { NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  const currencyConversion = await ApiClient.instance.getCurrencyConversion({
    sourceCurrency: request.query.sourceCurrency as string,
    targetCurrency: request.query.targetCurrency as string,
  })

  if (!currencyConversion) {
    throw new NotFound('Currency conversions not found')
  }

  response.status(200).json(currencyConversion)
})

export default handler
