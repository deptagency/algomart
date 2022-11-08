import { NextApiRequest, NextApiResponse } from 'next'

import { getTokenFromCookie } from '@/services/api/auth-service'
import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

async function handler(request: NextApiRequest, response: NextApiResponse) {
  try {
    await apiFetcher().get(urls.api.application.countries, {
      bearerToken: getTokenFromCookie(request, response),
    })
    response
      .status(200)
      .json({ healthy: true, services: [{ name: 'api', healthy: true }] })
  } catch {
    response
      .status(503)
      .json({ healthy: false, services: [{ name: 'api', healthy: false }] })
  }
}

export default handler
