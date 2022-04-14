import { BadRequest } from 'http-errors'
import type { NextApiResponse } from 'next'
import { Stripe } from 'stripe'

import { ApiClient } from '@/clients/api-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware())

type BodyType = Stripe.Identity.VerificationSessionCreateParams

handler.post(
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const body = request.body as BodyType

    if (!request.user.externalId) {
      throw new BadRequest('No externalId provided')
    }

    try {
      const result = await ApiClient.instance.createVerificationSession({
        externalId: request.user.externalId,
        ...body,
      })
      console.log('created verification session 2', result)
      return response.status(200).json(result)
    } catch (error) {
      console.error(error)
      response.status(400).send(error)
    }
  }
)

handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  if (!request.user.externalId) {
    throw new BadRequest('No externalId provided')
  }

  try {
    const verificationSession =
      await ApiClient.instance.retrieveVerificationSession(
        request.user.externalId
      )
    response.status(200).json(verificationSession)
  } catch (error) {
    console.error(error)
    response.status(400).send(error)
  }
})

export default handler
