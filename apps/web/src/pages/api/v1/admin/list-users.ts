import { BadRequest } from 'http-errors'
import { NextApiRequest, NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import configureAdmin from '@/clients/firebase-admin-client'
import createHandler from '@/middleware'
import adminMiddleware from '@/middleware/admin-middleware'
import authMiddleware, { WithToken } from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'

const handler = createHandler()

handler.use(authMiddleware()).use(userMiddleware()).use(adminMiddleware())

handler.get(
  async (request: NextApiRequest & WithToken, response: NextApiResponse) => {
    const data = await ApiClient.instance.getUsers(request.query)

    if (!data?.users) {
      throw new BadRequest('No users found')
    }
    const admin = configureAdmin()
    data.users = await Promise.all(
      data.users.map(async (user) => {
        const firebaseUser = await admin.auth().getUser(user.externalId)
        const claims = firebaseUser.customClaims
          ? Object.keys(firebaseUser.customClaims)
          : []
        return { ...user, claims }
      })
    )
    response.status(200).json(data)
  }
)

export default handler
