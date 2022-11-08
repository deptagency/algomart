import { NextApiRequest, NextApiResponse } from 'next'

import { AppConfig } from '@/config'
import { createLogger } from '@/utils/logger'

const logger = createLogger(AppConfig.logLevel)

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.query.token !== AppConfig.revalidateToken) {
    return response.status(401).json({ message: 'Invalid token' })
  }

  try {
    await response.revalidate('/')
    logger.info('[Next.js] Revalidating /')
    return response.json({ revalidated: true })
  } catch {
    return response.status(500).send('Error revalidating')
  }
}
