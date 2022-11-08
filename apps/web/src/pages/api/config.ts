import { NextApiHandler } from 'next'

import { getRawPublicConfig } from '@/config'

// This endpoint must be loaded via a script tag

const handler: NextApiHandler = (_, response) => {
  const config = getRawPublicConfig()
  response.setHeader('Content-Type', 'text/javascript')
  response.status(200)
  response.end(`window.__PUBLIC_CONFIG__ = ${JSON.stringify(config)}`)
}

export default handler
