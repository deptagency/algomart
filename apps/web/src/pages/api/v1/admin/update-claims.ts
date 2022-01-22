import { FirebaseClaim } from '@algomart/schemas'
import { BadRequest, Unauthorized } from 'http-errors'
import { NextApiResponse } from 'next'

import configureAdmin from '@/clients/firebase-admin-client'
import { Environment } from '@/environment'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware from '@/middleware/auth-middleware'
import userMiddleware from '@/middleware/user-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateCustomClaims } from '@/utils/auth-validation'

type BodyType = ExtractBodyType<typeof validateCustomClaims>

const handler = createHandler()
handler.use(authMiddleware()).use(userMiddleware())

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

    // Check permissions (not using admin middleware)
    const admin = configureAdmin()
    const firebaseUser = await admin.auth().getUser(request.user.externalId)
    const claims = firebaseUser.customClaims

    // If the user is not admin OR the logged in user isn't the admin email, throw error
    const isAdminUser =
      !!claims && Object.keys(claims).includes(FirebaseClaim.admin)
    const isLoggedInAdminUser =
      Environment.firebaseAdminEmail === request.user.email
    if (!isAdminUser && !isLoggedInAdminUser) {
      throw new Unauthorized('User does not have admin permissions')
    }

    // Check permissions (not using adminMiddleware)
    await admin.auth().setCustomUserClaims(request.user.externalId, {
      [request.body.role]: true,
    })
    response.json(firebaseUser)
  }
)
// #endregion Update claims

export default handler
