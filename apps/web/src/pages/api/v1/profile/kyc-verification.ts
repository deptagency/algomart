import { BadRequest } from 'http-errors'
import type { NextApiRequest, NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'

const handler = createHandler()

handler.post(async (request: NextApiRequest, response: NextApiResponse) => {
  const result = await ApiClient.instance.createVerificationSession({
    type: 'document',
  })
  return response.json(result)
})

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  if (
    !request.query.verificationSessionId ||
    typeof request.query.verificationSessionId !== 'string'
  ) {
    throw new BadRequest('Verification session ID is required')
  }

  const verificationSession =
    await ApiClient.instance.retrieveVerificationSession(
      request.query.verificationSessionId
    )

  response.status(200).json(verificationSession)
})

export default handler
