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
    // Check if permissions are already set
    const { key, value, userExternalId } = request.body
    const admin = configureAdmin()
    const firebaseUser = await admin.auth().getUser(userExternalId)
    const customClaims = firebaseUser.customClaims || {}
    if (value === false && customClaims[key]) {
      delete customClaims[key]
    } else {
      customClaims[key] = value
    }
    try {
      await admin.auth().setCustomUserClaims(userExternalId, customClaims)
    } catch {
      throw new BadRequest('Unable to set claims')
    }

    response.json({ claims: Object.keys(customClaims) })
  }
)
// #endregion Update claims

export default handler
