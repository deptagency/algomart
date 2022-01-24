import { FirebaseClaim } from '@algomart/schemas'
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
import { validateSetClaim } from '@/utils/auth-validation'

type BodyType = ExtractBodyType<typeof validateSetClaim>

const handler = createHandler()
handler.use(authMiddleware()).use(userMiddleware()).use(adminMiddleware())

// #region Update claims
handler.patch(
  validateBodyMiddleware(validateSetClaim),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    // Check permissions (not using admin middleware)
    const admin = configureAdmin()
    const firebaseUser = await admin.auth().getUser(request.body.userExternalId)
    const claims = firebaseUser.customClaims

    // Set permissions if not already set
    const isAdminUser =
      !!claims && Object.keys(claims).includes(FirebaseClaim.admin)
    if (!isAdminUser) {
      try {
        await admin.auth().setCustomUserClaims(request.body.userExternalId, {
          [request.body.role]: true,
        })
        return response.status(204)
      } catch {
        throw new BadRequest('Unable to set claims')
      }
    }

    return response.status(204)
  }
)
// #endregion Update claims

export default handler
