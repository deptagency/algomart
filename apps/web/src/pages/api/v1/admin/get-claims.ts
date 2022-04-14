import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import configureAdmin from '@/clients/firebase-admin-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()
handler.use(authMiddleware()).use(userMiddleware())

// Get claims for logged in user
handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  if (!request.user.externalId) {
    throw new BadRequest('No external ID provided')
  }

  const admin = configureAdmin()
  const firebaseUser = await admin.auth().getUser(request.user.externalId)
  const claims = firebaseUser.customClaims
    ? Object.keys(firebaseUser.customClaims)
    : []

  response.status(200).json({ claims: claims })
})

export default handler
