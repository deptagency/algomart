import { BadRequest } from 'http-errors'
import { NextApiResponse } from 'next'

import configureAdmin from '@/clients/firebase-admin-client'
import createHandler, { NextApiRequestApp } from '@/middleware'
import adminMiddleware from '@/middleware/admin-middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateCustomClaims } from '@/utils/auth-validation'

type BodyType = ExtractBodyType<typeof validateCustomClaims>

const handler = createHandler()
handler.use(authMiddleware()).use(userMiddleware()).use(adminMiddleware())

// #region Get claims for logged in user
handler.get(async (request: NextApiRequestApp, response: NextApiResponse) => {
  if (!request.user.externalId) {
    throw new BadRequest('No external ID provided')
  }
  const admin = configureAdmin()
  const firebaseUser = await admin.auth().getUser(request.user.externalId)
  const claims = firebaseUser.customClaims
    ? Object.keys(firebaseUser.customClaims)
    : []
  response.status(200).json({ roles: claims })
})
// #endregion Get claims for logged in user

// #region Update claims
handler.patch(
  validateBodyMiddleware(validateCustomClaims),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    if (!request.user.externalId) {
      throw new BadRequest('No external ID provided')
    }
    if (!request.body.role) {
      throw new BadRequest('No role provided')
    }
    const admin = configureAdmin()
    const firebaseUser = await admin
      .auth()
      .setCustomUserClaims(request.user.externalId, {
        [request.body.role]: true,
      })
    response.json(firebaseUser)
  }
)
// #endregion Update claims

export default handler
