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
import { validateCustomClaim } from '@/utils/auth-validation'

type BodyType = ExtractBodyType<typeof validateCustomClaim>

const handler = createHandler()
handler.use(authMiddleware()).use(userMiddleware()).use(adminMiddleware())

// #region Update claims
handler.patch(
  validateBodyMiddleware(validateCustomClaim),
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

    // Check permissions (not using adminMiddleware)
    await admin.auth().setCustomUserClaims(request.user.externalId, {
      [request.body.role]: true,
    })
    response.json(firebaseUser)
  }
)
// #endregion Update claims

export default handler
