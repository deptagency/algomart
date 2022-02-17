import { DEFAULT_LOCALE, FirebaseClaim } from '@algomart/schemas'
import { BadRequest } from 'http-errors'
import { NextApiRequest, NextApiResponse } from 'next'

import { ApiClient } from '@/clients/api-client'
import configureAdmin from '@/clients/firebase-admin-client'
import { Environment } from '@/environment'
import createHandler, { NextApiRequestApp } from '@/middleware'
import authMiddleware, { WithToken } from '@/middleware/auth-middleware'
import validateBodyMiddleware, {
  ExtractBodyType,
} from '@/middleware/validate-body-middleware'
import { validateUserRegistration } from '@/utils/auth-validation'
import { logger } from '@/utils/logger'

const handler = createHandler()
handler.use(authMiddleware())

type BodyType = ExtractBodyType<typeof validateUserRegistration>

handler.post(
  validateBodyMiddleware(validateUserRegistration),
  async (request: NextApiRequestApp<BodyType>, response: NextApiResponse) => {
    const body = request.validResult.value as BodyType
    const locale = body.locale || DEFAULT_LOCALE

    const user = await ApiClient.instance.getAccountByExternalId(
      request.token.uid
    )

    if (user) {
      throw new BadRequest('Account is already configured')
    }

    try {
      await ApiClient.instance.createAccount({
        currency: body.currency,
        email: body.email,
        externalId: request.token.uid,
        locale,
        passphrase: body.passphrase,
        username: body.username,
      })
    } catch {
      throw new BadRequest('Could not create account')
    }

    // Check if the account is the admin account, and if so set admin permissions
    if (body.email === Environment.firebaseAdminEmail) {
      try {
        const admin = configureAdmin()
        const firebaseUser = await admin.auth().getUser(request.token.uid)
        // If user doesn't already have claim, add admin claim
        if (
          !firebaseUser.customClaims ||
          !firebaseUser.customClaims[FirebaseClaim.admin]
        ) {
          await admin.auth().setCustomUserClaims(request.token.uid, {
            [FirebaseClaim.admin]: true,
          })
        }
      } catch (error) {
        logger.error(error, 'Unable to set claims')
      }
    }

    response.status(204).end()
  }
)

handler.get(
  async (request: NextApiRequest & WithToken, response: NextApiResponse) => {
    const user = await ApiClient.instance.getAccountByExternalId(
      request.token.uid
    )
    if (!user) throw new BadRequest('Account is not configured')
    response.json(user)
  }
)

// TODO: for managing one's profile
// handler.patch(async (req: NextApiRequestApp, res: NextApiResponse) => {})
// handler.put(async (req: NextApiRequestApp, res: NextApiResponse) => {})

export default handler
