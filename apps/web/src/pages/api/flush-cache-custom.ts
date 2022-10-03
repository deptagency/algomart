import { NextApiRequest, NextApiResponse } from 'next'

const { ENABLE_CACHE_FLUSHING_ROUTE } = process.env

async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (ENABLE_CACHE_FLUSHING_ROUTE === 'true') {
    try {
      const { path } = request.query

      if (Array.isArray(path)) {
        throw 'Error, no arrays.'
      }

      await response.revalidate(path)

      return response.json({ revalidated: true })
    } catch {
      // If there was an error, Next.js will continue
      // to show the last successfully generated page
      return response.status(500).send('Error revalidating')
    }
  } else {
    return response.status(403).json({ message: 'Cache flushing disabled.' })
  }
}

export default handler
